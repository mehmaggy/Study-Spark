
const BASE = '/api'
const KEY = 'studyspark_user'

export function getStoredUser() {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : null
}

export function storeUser(u) {
    localStorage.setItem(KEY, JSON.stringify(u))
}

export function clearUser() {
    localStorage.removeItem(KEY)
}

function headers() {
    const u = getStoredUser()

    return {
        'Content-Type': 'application/json',
        ...(u ? { 'X-User-Id': String(u.id) } : {})
    }
}

async function req(path, opts = {}) {
    const res = await fetch(BASE + path, {
        ...opts,
        headers: {
            ...headers(),
            ...(opts.headers || {})
        }
    })

    if (!res.ok) {
        let msg = 'Request failed'

        try {
            const e = await res.json()
            msg = e.detail || msg
        } catch {}

        throw new Error(msg)
    }

    const text = await res.text()
    return text ? JSON.parse(text) : null
}

export const api = {
    signup: (username, password) =>
        req('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),

    login: (username, password) =>
        req('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),

    decks: () => req('/decks'),

    createDeck: (name) =>
        req('/decks', {
            method: 'POST',
            body: JSON.stringify({ name })
        }),

    deleteDeck: (id) =>
        req('/decks/' + id, { method: 'DELETE' }),

    cards: (deckId) =>
        req(`/decks/${deckId}/cards`),

    addCard: (deckId, question, answer) =>
        req(`/decks/${deckId}/cards`, {
            method: 'POST',
            body: JSON.stringify({ question, answer })
        }),

    deleteCard: (id) =>
        req(`/cards/${id}`, { method: 'DELETE' }),

    generate: (deckId, notes) =>
        req(`/decks/${deckId}/generate`, {
            method: 'POST',
            body: JSON.stringify({ notes })
        }),

    due: (deckId) =>
        req(`/decks/${deckId}/review`),

    review: (cardId, rating) =>
        req(`/cards/${cardId}/review`, {
            method: 'POST',
            body: JSON.stringify({ rating })
        })
}
