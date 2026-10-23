
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout, ArrowLeft } from 'lucide-react'
import { supabase } from './supabase'
import './AuthPage.css'

type AuthPageProps = {
  mode: 'login' | 'signup'
}

function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const isSignup = mode === 'signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (error) throw error

        if (data.session) {
          setMessage('Account created successfully! Welcome to GramaRise.')
          setTimeout(() => navigate('/jobs'), 1200)
        } else {
          setMessage(
            'Account created! Check your email for the confirmation link, then log in.'
          )
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate('/jobs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <Sprout size={28} />
          <span>GramaRise</span>
        </Link>
      </header>

      <section className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} /> Back to homepage
        </Link>

        <p className="auth-eyebrow">GROWING TOGETHER · KADUPASSERY</p>

        <h1>{isSignup ? 'Join GramaRise' : 'Welcome back'}</h1>

        <p className="auth-description">
          {isSignup
            ? 'Create an account to connect with opportunities in your community.'
            : 'Log in to continue exploring opportunities closer to home.'}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={isSignup ? 8 : undefined}
              required
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isSignup
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
