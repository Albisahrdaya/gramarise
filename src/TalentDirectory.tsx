
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './TalentDirectory.css'

type TalentProfile = {
  user_id: string
  full_name: string
  location: string
  education: string
  experience_years: number
  skills: string[]
  bio: string
}

function TalentDirectory() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = useState<TalentProfile[]>([])
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [requestingProfile, setRequestingProfile] =
    useState<TalentProfile | null>(null)
  const [opportunityTitle, setOpportunityTitle] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requestStatus, setRequestStatus] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)

  // Load public resident profiles.
  useEffect(() => {
    let active = true

    async function loadTalent() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError || !authData.user) {
          navigate('/login')
          return
        }

        const { data, error: queryError } = await supabase
          .from('resident_profiles')
          .select(
            'user_id, full_name, location, education, experience_years, skills, bio'
          )
          .eq('is_public', true)
          .order('full_name', { ascending: true })

        if (!active) return

        if (queryError) {
          console.error('Talent directory query error:', queryError)
          setError(
            'Unable to load the talent directory. ' + queryError.message
          )
        } else {
          setProfiles((data ?? []) as TalentProfile[])
        }
      } catch (err) {
        if (!active) return

        console.error('Unable to load talent:', err)
        setError('Something went wrong while loading resident profiles.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadTalent()

    return () => {
      active = false
    }
  }, [navigate])

  // Send a connection request to the selected resident.
  async function handleSendRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!requestingProfile || sendingRequest) return

    setSendingRequest(true)
    setRequestStatus('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setRequestStatus('Please log in before sending a request.')
        return
      }

      if (requestingProfile.user_id === authData.user.id) {
        setRequestStatus(
          'You cannot send a request to your own profile. Please use another test account.'
        )
        return
      }

      // Confirm the selected resident still has a public profile.
      const { data: resident, error: residentError } = await supabase
        .from('resident_profiles')
        .select('user_id')
        .eq('user_id', requestingProfile.user_id)
        .eq('is_public', true)
        .maybeSingle()

      if (residentError || !resident) {
        setRequestStatus(
          'This resident profile is no longer available publicly.'
        )
        return
      }

      const { error: insertError } = await supabase
        .from('talent_connection_requests')
        .insert({
          employer_id: authData.user.id,
          resident_id: resident.user_id,
          opportunity_title: opportunityTitle.trim(),
          message: requestMessage.trim(),
        })

      if (insertError) {
        console.error('Connection request error:', insertError)
        setRequestStatus(
          insertError.code === '23505'
            ? 'A request may already exist. Please check your sent requests.'
            : `Unable to send request: ${insertError.message}`
        )
        return
      }

      setRequestStatus('Connection request sent successfully!')
      setOpportunityTitle('')
      setRequestMessage('')
    } catch (err) {
      console.error('Unexpected connection request error:', err)
      setRequestStatus('Something went wrong. Please try again.')
    } finally {
      setSendingRequest(false)
    }
  }

  const locations = useMemo(
    () =>
      [...new Set(profiles.map(profile => profile.location).filter(Boolean))]
        .sort(),
    [profiles]
  )

  // Filter profiles by name, skill, education, bio, and location.
  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase()

    return profiles.filter(profile => {
      const matchesSearch =
        !term ||
        profile.full_name.toLowerCase().includes(term) ||
        profile.education.toLowerCase().includes(term) ||
        profile.bio.toLowerCase().includes(term) ||
        profile.skills.some(skill => skill.toLowerCase().includes(term)) ||
        profile.location.toLowerCase().includes(term)

      const matchesLocation =
        !locationFilter || profile.location === locationFilter

      return matchesSearch && matchesLocation
    })
  }, [profiles, search, locationFilter])

  return (
    <main className="talent-page">
      <header className="talent-header">
        <Link to="/" className="talent-brand">
          GramaRise
        </Link>

        <nav className="talent-nav">
          <Link to="/jobs">Find Jobs</Link>
          <Link to="/profile">My Profile</Link>
        </nav>
      </header>

      <section className="talent-hero">
        <p className="talent-eyebrow">
          LOCAL SKILLS. REAL OPPORTUNITIES.
        </p>

        <h1>Discover talent in your community.</h1>

        <p>
          Find local skills, education and experience to help connect
          residents with employers and opportunities.
        </p>

        <Link to="/profile" className="talent-profile-link">
          Create or update your profile →
        </Link>
      </section>

      <section className="talent-content">
        <div className="talent-section-heading">
          <div>
            <h2>Resident Talent Directory</h2>
            <p>Explore profiles shared by local residents.</p>
          </div>

          {!loading && (
            <span className="talent-count">
              {filteredProfiles.length}{' '}
              {filteredProfiles.length === 1 ? 'profile' : 'profiles'}
            </span>
          )}
        </div>

        <div className="talent-filters">
          <label className="talent-search">
            <span>Search talent</span>
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Name, skill, education or location..."
            />
          </label>

          <label className="talent-location-filter">
            <span>Filter by location</span>
            <select
              value={locationFilter}
              onChange={event => setLocationFilter(event.target.value)}
            >
              <option value="">All locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && (
          <p className="talent-message">
            Loading resident profiles...
          </p>
        )}

        {!loading && error && (
          <p className="talent-message talent-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && filteredProfiles.length === 0 && (
          <div className="talent-empty">
            <h3>No matching profiles yet</h3>
            <p>
              Try a different search, or encourage residents to create
              profiles and enable public visibility.
            </p>

            {(search || locationFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setLocationFilter('')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredProfiles.length > 0 && (
          <div className="talent-grid">
            {filteredProfiles.map(profile => (
              <article
                className="talent-card"
                key={profile.user_id}
              >
                <div className="talent-card-top">
                  <div className="talent-avatar" aria-hidden="true">
                    {profile.full_name.trim().charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="talent-person">
                    <h3>{profile.full_name}</h3>
                    <p>⌖ {profile.location}</p>
                  </div>
                </div>

                <div className="talent-education">
                  <span>EDUCATION</span>
                  <p>{profile.education || 'Not specified'}</p>
                </div>

                <div className="talent-experience">
                  <strong>{profile.experience_years}</strong>
                  <span>
                    {profile.experience_years === 1 ? 'year' : 'years'} of
                    experience
                  </span>
                </div>

                {profile.bio && (
                  <p className="talent-bio">{profile.bio}</p>
                )}

                <div className="talent-skills">
                  <span className="talent-skills-label">SKILLS</span>

                  <div className="talent-tags">
                    {profile.skills.length > 0 ? (
                      profile.skills.map((skill, skillIndex) => (
                        <span key={`${skill}-${skillIndex}`}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span>Skills not specified</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="talent-contact-button"
                  onClick={() => {
                    setRequestingProfile(profile)
                    setRequestStatus('')
                    setOpportunityTitle('')
                    setRequestMessage('')
                  }}
                >
                  Contact about an opportunity
                </button>
              </article>
            ))}
          </div>
        )}

        {/* Keep the modal outside the profile cards and talent grid. */}
        {requestingProfile && (
          <div
            className="talent-modal-backdrop"
            onClick={event => {
              if (event.target === event.currentTarget && !sendingRequest) {
                setRequestingProfile(null)
                setRequestStatus('')
              }
            }}
          >
            <section
              className="talent-request-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="talent-request-title"
            >
              <button
                type="button"
                className="talent-modal-close"
                onClick={() => {
                  if (!sendingRequest) {
                    setRequestingProfile(null)
                    setRequestStatus('')
                  }
                }}
                aria-label="Close request form"
                disabled={sendingRequest}
              >
                ×
              </button>

              <h2 id="talent-request-title">
                Contact {requestingProfile.full_name}
              </h2>

              <p>Introduce your opportunity to this resident.</p>

              <form
                onSubmit={handleSendRequest}
                className="talent-request-form"
              >
                <label>
                  Opportunity title
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={opportunityTitle}
                    onChange={event =>
                      setOpportunityTitle(event.target.value)
                    }
                    placeholder="e.g. Junior Web Developer"
                  />
                </label>

                <label>
                  Your message
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={5}
                    value={requestMessage}
                    onChange={event =>
                      setRequestMessage(event.target.value)
                    }
                    placeholder="Introduce yourself and explain the opportunity..."
                  />
                </label>

                {requestStatus && (
                  <p
                    role="status"
                    className="talent-request-status"
                  >
                    {requestStatus}
                  </p>
                )}

                <button
                  type="submit"
                  className="talent-contact-button"
                  disabled={sendingRequest}
                >
                  {sendingRequest
                    ? 'Sending...'
                    : 'Send connection request'}
                </button>
              </form>
            </section>
          </div>
        )}
      </section>

      <footer className="talent-footer">
        Growing Villages, Creating Opportunities.
      </footer>
    </main>
  )
}

export default TalentDirectory
