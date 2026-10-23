
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './supabase'
import './ProfilePage.css'
<Link to="/received-requests">Connection Requests</Link>

type Profile = {
  full_name: string
  location: string
  education: string
  experience_years: number
  skills: string[]
  bio: string
  is_public: boolean
}

const emptyProfile: Profile = {
  full_name: '',
  location: 'Kadupassery',
  education: '',
  experience_years: 0,
  skills: [],
  bio: '',
  is_public: false,
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [skillsText, setSkillsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError('Please log in to create your resident profile.')
        setLoading(false)
        return
      }

      const { data, error: profileError } = await supabase
        .from('resident_profiles')
        .select(
          'full_name, location, education, experience_years, skills, bio, is_public'
        )
        .eq('user_id', authData.user.id)
        .maybeSingle()

      if (profileError) {
        setError(profileError.message)
      } else if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          location: data.location ?? 'Kadupassery',
          education: data.education ?? '',
          experience_years: data.experience_years ?? 0,
          skills: data.skills ?? [],
          bio: data.bio ?? '',
          is_public: data.is_public ?? false,
        })
        setSkillsText((data.skills ?? []).join(', '))
      }

      setLoading(false)
    }

    void loadProfile()
  }, [])

  function updateField<K extends keyof Profile>(
    field: K,
    value: Profile[K]
  ) {
    setProfile(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError || !authData.user) {
      setError('Your session has expired. Please log in again.')
      setSaving(false)
      return
    }

    const cleanSkills = [
      ...new Set(
        skillsText
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean)
      ),
    ]

    const profileToSave = {
      user_id: authData.user.id,
      full_name: profile.full_name.trim(),
      location: profile.location.trim(),
      education: profile.education.trim(),
      experience_years: Number(profile.experience_years),
      skills: cleanSkills,
      bio: profile.bio.trim(),
      is_public: profile.is_public,
      updated_at: new Date().toISOString(),
    }

    const { error: saveError } = await supabase
      .from('resident_profiles')
      .upsert(profileToSave, { onConflict: 'user_id' })

    if (saveError) {
      setError(saveError.message)
    } else {
      setProfile(current => ({ ...current, skills: cleanSkills }))
      setMessage('Your resident profile has been saved!')
    }

    setSaving(false)
  }

  if (loading) {
    return <main className="profile-page"><p>Loading your profile...</p></main>
  }

  if (error && error.includes('Please log in')) {
    return (
      <main className="profile-page">
        <section className="profile-panel">
          <h1>Resident Profile</h1>
          <p>{error}</p>
          <Link to="/login" className="profile-button">Go to login</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <section className="profile-panel">
        <Link to="/" className="profile-back">← Back to GramaRise</Link>

        <p className="profile-eyebrow">GRAMARISE COMMUNITY</p>
        <h1>Your Resident Profile</h1>
        <p className="profile-description">
          Share your skills and experience to help local employers discover
          opportunities in your community.
        </p>

        {error && <p className="profile-alert profile-error">{error}</p>}
        {message && <p className="profile-alert profile-success">{message}</p>}

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Full name *
            <input
              required
              maxLength={100}
              value={profile.full_name}
              onChange={e => updateField('full_name', e.target.value)}
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Location *
            <input
              required
              maxLength={120}
              value={profile.location}
              onChange={e => updateField('location', e.target.value)}
              placeholder="e.g. Kadupassery"
            />
          </label>

          <label>
            Education *
            <input
              required
              maxLength={200}
              value={profile.education}
              onChange={e => updateField('education', e.target.value)}
              placeholder="e.g. B.Tech Computer Science, 2nd year"
            />
          </label>

          <label>
            Years of experience
            <input
              type="number"
              min={0}
              max={60}
              required
              value={profile.experience_years}
              onChange={e =>
                updateField('experience_years', Number(e.target.value))
              }
            />
          </label>

          <label>
            Skills *
            <input
              required
              maxLength={1000}
              value={skillsText}
              onChange={e => setSkillsText(e.target.value)}
              placeholder="e.g. Java, React, Video Editing"
            />
            <span className="profile-hint">
              Separate each skill with a comma.
            </span>
          </label>

          <label>
            About you
            <textarea
              maxLength={1000}
              rows={5}
              value={profile.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Describe your interests, strengths and career goals."
            />
          </label>

          <label className="profile-visibility">
            <input
              type="checkbox"
              checked={profile.is_public}
              onChange={e => updateField('is_public', e.target.checked)}
            />
            <span>
              <strong>Show my profile in the talent directory</strong>
              <small>
                When enabled, your name, location, education, skills,
                experience and introduction can be seen by signed-in users.
                Do not include private contact information in your introduction.
              </small>
            </span>
          </label>

          <button type="submit" className="profile-button" disabled={saving}>
            {saving ? 'Saving profile...' : 'Save profile'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
