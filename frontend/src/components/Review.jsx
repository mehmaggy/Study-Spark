
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Review({ deck, onDone }) {
    const [queue, setQueue] = useState(null)
    const [showAnswer, setShowAnswer] = useState(false)

    useEffect(() => {
        api.due(deck.id).then(setQueue)
    }, [deck.id])

    if (queue === null) return <p>Loading...</p>

    if (queue.length === 0) {
        return (
            <div className="review-done">
                <h2>All caught up!</h2>
                <p>No cards are due for "{deck.name}" right now.</p>
                <button className="primary" onClick={onDone}>
                    Back to deck
                </button>
            </div>
        )
    }

    const current = queue[0]

    async function rate(rating) {
        const updated = await api.review(current.id, rating)
        setShowAnswer(false)

        setQueue(q => {
            const [first, ...rest] = q

            return rating === 'again'
                ? [...rest, { ...first, ...updated }]
                : rest
        })
    }

    return (
        <div className="review">
            <button className="link" onClick={onDone}>
                End session
            </button>

            <p className="progress">{queue.length} card(s) left</p>

            <div className="flashcard">
                <div className="q">{current.question}</div>

                {showAnswer ? (
                    <div className="a">{current.answer}</div>
                ) : (
                    <button
                        className="ghost"
                        onClick={() => setShowAnswer(true)}
                    >
                        Show answer
                    </button>
                )}
            </div>

            {showAnswer && (
                <div className="rate-row">
                    <button className="rate again" onClick={() => rate('again')}>
                        Again
                    </button>
                    <button className="rate good" onClick={() => rate('good')}>
                        Good
                    </button>
                    <button className="rate easy" onClick={() => rate('easy')}>
                        Easy
                    </button>
                </div>
            )}
        </div>
    )
}
