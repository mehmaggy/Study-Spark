
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function DeckView({ deck, onBack, onReview }) {
    const [cards, setCards] = useState([])
    const [q, setQ] = useState('')
    const [a, setA] = useState('')
    const [notes, setNotes] = useState('')
    const [busy, setBusy] = useState(false)
    const [msg, setMsg] = useState('')

    async function load() {
        setCards(await api.cards(deck.id))
    }

    useEffect(() => {
        load()
    }, [deck.id])

    async function add() {
        if (!q.trim() || !a.trim()) return

        await api.addCard(deck.id, q, a)
        setQ('')
        setA('')
        load()
    }

    async function remove(id) {
        await api.deleteCard(id)
        load()
    }

    async function generate() {
        if (!notes.trim()) return

        setBusy(true)
        setMsg('Generating...')

        try {
            const created = await api.generate(deck.id, notes)
            setMsg(`Added ${created.length} card(s).`)
            setNotes('')
            load()
        } catch (e) {
            setMsg('Error: ' + e.message)
        } finally {
            setBusy(false)
        }
    }

    const today = new Date().toISOString().slice(0, 10)
    const dueCount = cards.filter(c => c.due_date <= today).length

    return (
        <div>
            <button className="link" onClick={onBack}>
                ← Back to decks
            </button>

            <div className="deck-header">
                <h2>{deck.name}</h2>
                <button
                    className="primary"
                    onClick={onReview}
                    disabled={cards.length === 0}
                >
                    Review{dueCount > 0 ? ` (${dueCount} due)` : ''}
                </button>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3>✨ Generate cards from notes</h3>
                    <p className="hint">
                        Paste a paragraph of notes and let StudySpark write the flashcards.
                    </p>

                    <textarea
                        rows="5"
                        placeholder="Paste your class notes here…"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />

                    <button
                        className="primary"
                        onClick={generate}
                        disabled={busy}
                    >
                        {busy ? 'Working…' : 'Generate'}
                    </button>

                    <span className="msg">{msg}</span>
                </div>

                <div className="card">
                    <h3>Add a card manually</h3>

                    <input
                        placeholder="Question"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />

                    <input
                        placeholder="Answer"
                        value={a}
                        onChange={e => setA(e.target.value)}
                    />

                    <button className="primary" onClick={add}>
                        Add card
                    </button>
                </div>
            </div>

            <h3 className="mt">Cards ({cards.length})</h3>

            {cards.length === 0 && (
                <p className="empty">
                    No cards yet. Generate some from notes, or add one manually.
                </p>
            )}

            <ul className="card-list">
                {cards.map(c => (
                    <li key={c.id}>
                        <div>
                            <strong>{c.question}</strong>
                            <div className="ans">{c.answer}</div>
                        </div>

                        <button
                            className="link"
                            onClick={() => remove(c.id)}
                        >
                            delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}


