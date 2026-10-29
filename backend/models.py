from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    decks = relationship("Deck", back_populates="user", cascade="all, delete-orphan")


class Deck(Base):
    __tablename__ = "decks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    # --- SM-2 spaced-repetition state ---
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)       # days until next review
    repetitions = Column(Integer, default=0)    # consecutive correct reviews
    due_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)
    deck = relationship("Deck", back_populates="cards")
    reviews = relationship("Review", back_populates="card", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    quality = Column(Integer, nullable=False)   # SM-2 quality score (0-5)
    reviewed_at = Column(DateTime, default=datetime.utcnow)
    next_review_date = Column(Date)
    ease_factor = Column(Float)
    card = relationship("Card", back_populates="reviews")