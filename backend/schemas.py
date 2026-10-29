from pydantic import BaseModel
from datetime import date

class AuthIn(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id:int
    username:str

class DeckIn(BaseModel):
    name:str

class DeckOut(BaseModel):
    id:int
    name: str
    card_count: int = 0
    due_count: int = 0

class CardIn(BaseModel):
    question: str
    answer: str

class CardOut(BaseModel):
    id: int
    deck_id: int
    question: str
    ease_factor: float
    interval: int
    repetitions: int
    due_date: date
    class Config:
        from_attributes = True

class NotesIn(BaseModel):
    notes: str

class ReviewIn(BaseModel):
    rating: str #"again"|"good"|"easy"