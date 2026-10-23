
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sprout } from 'lucide-react'
import { supabase } from './supabase'
import './AuthPage.css'
import './PostJobPage.css'

function PostJobPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('Kadupassery')
  const [type, setType] = useState('Full-time')
  const [salary, setSalary] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        navigate('/login')
        return
      }

      const { error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          type,
          salary: salary.trim() || null,
          description: description.trim() || null,
          employer_id: userData.user.id,
          status: 'draft',
        })

      if (insertError) throw insertError

      setSuccess('Your job listing has been saved as a draft.')
      setTitle('')
      setCompany('')
      setLocation('Kadupassery')
      setType('Full-time')
      setSalary('')
      setDescription('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save the job listing.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="post-job-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <Sprout size={28} />
          <span>GramaRise</span>
        </Link>
      </header>

      <section className="post-job-content">
        <Link to="/employer/dashboard" className="auth-back">
          <ArrowLeft size={17} /> Back to dashboard
        </Link>

        <p className="auth-eyebrow">EMPLOYER WORKSPACE</p>
        <h1>Post a job vacancy</h1>
        <p className="post-job-intro">
          Help local people discover employment opportunities closer to home.
        </p>

        <form className="post-job-form" onSubmit={handleSubmit}>
          <label>
            Job title *
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Junior Web Developer"
              required
              maxLength={120}
            />
          </label>

          <label>
            Company or business name *
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Enter your business name"
              required
              maxLength={120}
            />
          </label>

          <label>
            Job location *
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Kadupassery, Kodakara"
              required
              maxLength={120}
            />
          </label>

          <label>
            Employment type *
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
            </select>
          </label>

          <label>
            Salary or pay range
            <input
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder="e.g. ₹15,000–₹22,000/month"
              maxLength={100}
            />
          </label>

          <label>
            Job description *
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe responsibilities, skills required, and how the role works."
              rows={6}
              required
              maxLength={5000}
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-message" role="status">{success}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save job as draft'}
          </button>

          <p className="post-job-note">
            New listings are saved as drafts and won't appear publicly until
            an administrator reviews and publishes them.
          </p>
        </form>
      </section>
    </main>
  )
}

export default PostJobPage
