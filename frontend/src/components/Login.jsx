
import { useState } from 'react'
import { api } from '../api'

export default function Login({ onLogin }) {
    const [mode, setMode] = useState('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [err, setErr] = useState('')

    async function submit() {
        setErr('')

        try {
            const u = mode === 'login'
                ? await api.login(username, password)
                : await api.signup(username, password)

            onLogin(u)
        } catch (e) {
            setErr(e.message)
        }
    }

    return (
        <div className="auth">
            <div className="auth-card">
                <div className="brand center">
                    <span className="logo">⚡</span>
                    <h1>StudySpark</h1>
                </div>

                <p className="subtitle center">
                    AI flashcards with spaced repetition
                </p>

                <input
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                />

                <button className="primary" onClick={submit}>
                    {mode === 'login' ? 'Log in' : 'Sign up'}
                </button>

                {err && <p className="error">{err}</p>}

                <p className="toggle">
                    {mode === 'login' ? 'No account?' : 'Have an account?'}{' '}

                    <button
                        className="link"
                        onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login')
                            setErr('')
                        }}
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    )
}
