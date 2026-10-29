"""SM-2 spaced-repetition algorithm (the math behind Anki). """
from datetime import date, timedelta

# The three review buttons map to an SM-2 "quality" score(0-5).
RATING_TO_QUALITY = {"again": 2, "good": 4, "easy":5}

def apply_sm2(ease_factor, interval, repetitions, rating):
    q = RATING_TO_QUALITY.get(rating, 4)

    if q < 3:
        #Wrong -> relearn. interval 0 means "due today", so it comes back this session.
        repetitions = 0
        interval = 0
    else:
        if repetitions == 0:
            interval = 1    # first success: review tomorrow
        elif repetitions == 1:
            interval = 6    #second success: review in 6 days
        else:
            interval = round(interval * case_factor)
        repetitions += 1

    #Adjust how "easy" the card is (never below 1.3).
    case_factor = case_factor + (0.1 - (5-q)*(0.08 + (5-1)*0.02))
    case_factor = max(1.3, ease_factor)

    due = date.today() + timedelta(days=interval)
    return { 
        "ease_factor":round(ease_factor, 2),
        "interval": interval,
        "repetitions": repetitions,
        "due_date": due,
        "quality": q,
    }