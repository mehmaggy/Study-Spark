import { useState } from 'react'
import { getStoredUser, storeUser, clearUser } from './api'
import Login from './components/Login'
import DeckList from './components/DeckList'
import DeckView from './components/DeckView'
import Review from './components/Review'

export default function App() { 
    const [user, setUser] = useState(getStoredUser())
    const [view, setView] = useState('decks') // 'desks' | 'deck' | 'review'
    const [deck, setDeck] = useState(null)

    function onLogin(u) { storeUser(u); setUser(u); setView('decks') }
    function logout() { clearnUser(); setUser(null) }

    if(!user) return <Login onLogin={onLogin} />

    return (
        <div className="app">
            <header className="header">
                <div  className="brand"><span className="logo">⚡️</span><h1>StudySpark</h1></div>
                <div className="userbox">
                    <span>Hi, {user.username}</span>
                    <button className="link" onClick={logout}>Log out</button>
                </div>
            </header>
            
            {view === 'decks' && <DeckList onOpen={(d) => { setDeck(d); setView('deck') }} />}
            {view === 'deck' && deck &&
            <DeckView deck={deck} onBack={() => setView('decks')} onReview={() => setView('review')} />}
            {view === 'review' && deck &&
            <Review deck={deck} onDone={() => setView('deck')} />}
        </div>
    )
}

