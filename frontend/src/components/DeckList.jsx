
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function DeckList({ onOpen }) {
    const [decks, setDecks] = useState([])
    const [name, setName] = useState('')

    async function load() {
        setDecks(await api.decks())
    }

    useEffect(() => {
        load()
    }, [])

    async function create() {
        if (!name.trim()) return

        await api.createDeck(name.trim())
        setName('')
        load()
    }

    async function remove(id, e) {
        e.stopPropagation()

        if (confirm('Delete this deck and all its cards?')) {
            await api.deleteDeck(id)
            load()
        }
    }

    return (
        <div>
            <h2>Your Decks</h2>

            <div className="row">
                <input
                    placeholder="New deck name (e.g. Biology Ch. 3)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && create()}
                />

                <button className="primary" onClick={create}>
                    Create
                </button>
            </div>

            {decks.length === 0 && (
                <p className="empty">
                    No decks yet. Create your first one above.
                </p>
            )}

            <div className="deck-grid">
                {decks.map(d => (
                    <div
                        key={d.id}
                        className="deck-card"
                        onClick={() => onOpen(d)}
                    >
                        <div className="deck-top">
                            <h3>{d.name}</h3>

                            <button
                                className="link"
                                onClick={e => remove(d.id, e)}
                            >
                                delete
                            </button>
                        </div>

                        <div className="deck-meta">
                            <span>{d.card_count} cards</span>

                            {d.due_count > 0 ? (
                                <span className="due">
                                    {d.due_count} due
                                </span>
                            ) : (
                                <span className="ok">
                                    all caught up
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
