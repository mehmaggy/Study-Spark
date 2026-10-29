from dotenv import load_dotenv
load_dotenv()   # read backend/.env before anything else

from datetime import date
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import bcrypt

from database import Base, engine, get_db
from models import User, Deck, Card, Review
from schemas import AuthIn, UserOut, DeckIn, DeckOut, CardIn, CardOut, NotesIn, ReviewIn
from srs import apply_sm2
from ai import generate_cards_from_notes

Base.metadata.create_all(bind=engine)   # create tables on startup

app = FastAPI(title="StudySpark API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------- password helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


# ---------- "who is logged in" ----------
# For simplicity we identify the user with an X-User-Id header returned at login.
# A production app would use a signed token (JWT) — a great next step to mention!
def current_user(x_user_id: int = Header(None), db: Session = Depends(get_db)) -> User:
    if x_user_id is None:
        raise HTTPException(401, "Not logged in")
    user = db.get(User, x_user_id)
    if not user:
        raise HTTPException(401, "Invalid user")
    return user

def owned_deck(deck_id: int, user: User, db: Session) -> Deck:
    deck = db.get(Deck, deck_id)
    if not deck or deck.user_id != user.id:
        raise HTTPException(404, "Deck not found")
    return deck

def owned_card(card_id: int, user: User, db: Session) -> Card:
    card = db.get(Card, card_id)
    if not card or db.get(Deck, card.deck_id).user_id != user.id:
        raise HTTPException(404, "Card not found")
    return card


# ---------- auth ----------
@app.post("/api/auth/signup", response_model=UserOut)
def signup(payload: AuthIn, db: Session = Depends(get_db)):
    if not payload.username.strip() or len(payload.password) < 4:
        raise HTTPException(400, "Username required and password must be 4+ characters")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(400, "Username already taken")
    user = User(username=payload.username.strip(), password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    return UserOut(id=user.id, username=user.username)

@app.post("/api/auth/login", response_model=UserOut)
def login(payload: AuthIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Wrong username or password")
    return UserOut(id=user.id, username=user.username)


# ---------- decks ----------
@app.get("/api/decks", response_model=list[DeckOut])
def list_decks(user: User = Depends(current_user), db: Session = Depends(get_db)):
    today = date.today()
    decks = db.query(Deck).filter(Deck.user_id == user.id).order_by(Deck.created_at.desc()).all()
    out = []
    for d in decks:
        card_count = db.query(Card).filter(Card.deck_id == d.id).count()
        due_count = db.query(Card).filter(Card.deck_id == d.id, Card.due_date <= today).count()
        out.append(DeckOut(id=d.id, name=d.name, card_count=card_count, due_count=due_count))
    return out

@app.post("/api/decks", response_model=DeckOut)
def create_deck(payload: DeckIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(400, "Deck name required")
    deck = Deck(user_id=user.id, name=payload.name.strip())
    db.add(deck); db.commit(); db.refresh(deck)
    return DeckOut(id=deck.id, name=deck.name, card_count=0, due_count=0)

@app.delete("/api/decks/{deck_id}")
def delete_deck(deck_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(owned_deck(deck_id, user, db)); db.commit()
    return {"deleted": deck_id}


# ---------- cards ----------
@app.get("/api/decks/{deck_id}/cards", response_model=list[CardOut])
def list_cards(deck_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    owned_deck(deck_id, user, db)
    return db.query(Card).filter(Card.deck_id == deck_id).order_by(Card.id).all()

@app.post("/api/decks/{deck_id}/cards", response_model=CardOut)
def add_card(deck_id: int, payload: CardIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    owned_deck(deck_id, user, db)
    if not payload.question.strip() or not payload.answer.strip():
        raise HTTPException(400, "Question and answer required")
    card = Card(deck_id=deck_id, question=payload.question.strip(), answer=payload.answer.strip())
    db.add(card); db.commit(); db.refresh(card)
    return card

@app.put("/api/cards/{card_id}", response_model=CardOut)
def update_card(card_id: int, payload: CardIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    card = owned_card(card_id, user, db)
    card.question, card.answer = payload.question.strip(), payload.answer.strip()
    db.commit(); db.refresh(card)
    return card

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(owned_card(card_id, user, db)); db.commit()
    return {"deleted": card_id}


# ---------- AI generation ----------
@app.post("/api/decks/{deck_id}/generate", response_model=list[CardOut])
def generate(deck_id: int, payload: NotesIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    owned_deck(deck_id, user, db)
    created = []
    for p in generate_cards_from_notes(payload.notes):
        card = Card(deck_id=deck_id, question=p["question"], answer=p["answer"])
        db.add(card); created.append(card)
    db.commit()
    for c in created:
        db.refresh(c)
    return created


# ---------- review (SM-2) ----------
@app.get("/api/decks/{deck_id}/review", response_model=list[CardOut])
def due_cards(deck_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    owned_deck(deck_id, user, db)
    return (db.query(Card).filter(Card.deck_id == deck_id, Card.due_date <= date.today())
            .order_by(Card.due_date, Card.id).all())

@app.post("/api/cards/{card_id}/review", response_model=CardOut)
def review_card(card_id: int, payload: ReviewIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    card = owned_card(card_id, user, db)
    r = apply_sm2(card.ease_factor, card.interval, card.repetitions, payload.rating)
    card.ease_factor, card.interval = r["ease_factor"], r["interval"]
    card.repetitions, card.due_date = r["repetitions"], r["due_date"]
    db.add(Review(card_id=card.id, quality=r["quality"],
                  next_review_date=r["due_date"], ease_factor=r["ease_factor"]))
    db.commit(); db.refresh(card)
    return card