
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './ReceivedRequests.css'

type ConnectionRequest = {
  id: number
  employer_id: string
  resident_id: string
  opportunity_title: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

function ReceivedRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function loadRequests() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError || !authData.user) {
          navigate('/login')
          return
        }

        const { data, error: queryError } = await supabase
          .from('talent_connection_requests')
          .select(
            'id, employer_id, resident_id, opportunity_title, message, status, created_at'
          )
          .eq('resident_id', authData.user.id)
          .order('created_at', { ascending: false })

        if (!active) return

        if (queryError) {
          console.error('Received requests error:', queryError)
          setError('Unable to load requests: ' + queryError.message)
        } else {
          setRequests((data ?? []) as ConnectionRequest[])
        }
      } catch (err) {
        if (!active) return
        console.error(err)
        setError('Something went wrong while loading requests.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadRequests()

    return () => {
      active = false
    }
  }, [navigate])

  async function updateRequest(
    requestId: number,
    status: 'accepted' | 'declined'
  ) {
    if (updatingId !== null) return

    setUpdatingId(requestId)
    setError('')
    setNotice('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError('Please log in again.')
        return
      }

      const { data, error: updateError } = await supabase
        .from('talent_connection_requests')
        .update({ status })
        .eq('id', requestId)
        .eq('resident_id', authData.user.id)
        .eq('status', 'pending')
        .select('id, status')
        .maybeSingle()

      if (updateError) {
        console.error('Request update error:', updateError)
        setError('Unable to update request: ' + updateError.message)
        return
      }

      if (!data) {
        setError(
          'This request could not be updated. It may already have been handled or you may not have permission.'
        )
        return
      }

      setRequests(current =>
        current.map(request =>
          request.id === requestId
            ? { ...request, status }
            : request
        )
      )

      setNotice(
        status === 'accepted'
          ? 'Connection request accepted.'
          : 'Connection request declined.'
      )
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="received-page">
      <header className="received-header">
        <Link to="/" className="received-brand">GramaRise</Link>
        <nav>
          <Link to="/talent">Talent Directory</Link>
          <Link to="/profile">My Profile</Link>
        </nav>
      </header>

      <section className="received-hero">
        <p className="received-eyebrow">YOUR NEXT OPPORTUNITY</p>
        <h1>Connection Requests</h1>
        <p>
          Review messages from employers interested in your skills.
          You decide which requests to accept.
        </p>
      </section>

      <section className="received-content">
        {loading && (
          <p className="received-message">Loading your requests...</p>
        )}

        {!loading && error && (
          <p className="received-alert" role="alert">{error}</p>
        )}

        {notice && (
          <p className="received-notice" role="status">{notice}</p>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="received-empty">
            <h2>No connection requests yet</h2>
            <p>
              When an employer contacts you through your public talent
              profile, their request will appear here.
            </p>
            <Link to="/talent">Explore the talent directory</Link>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="received-list">
            {requests.map(request => (
              <article className="received-card" key={request.id}>
                <div className="received-card-heading">
                  <div>
                    <span className="received-label">
                      OPPORTUNITY
                    </span>
                    <h2>{request.opportunity_title}</h2>
                  </div>

                  <span className={`received-status status-${request.status}`}>
                    {request.status}
                  </span>
                </div>

                <p className="received-request-message">
                  {request.message}
                </p>

                <p className="received-date">
                  Received {new Date(request.created_at).toLocaleString()}
                </p>

                {request.status === 'pending' && (
                  <div className="received-actions">
                    <button
                      type="button"
                      className="received-accept"
                      disabled={updatingId !== null}
                      onClick={() => updateRequest(request.id, 'accepted')}
                    >
                      {updatingId === request.id ? 'Updating...' : 'Accept'}
                    </button>

                    <button
                      type="button"
                      className="received-decline"
                      disabled={updatingId !== null}
                      onClick={() => updateRequest(request.id, 'declined')}
                    >
                      {updatingId === request.id ? 'Updating...' : 'Decline'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default ReceivedRequests
