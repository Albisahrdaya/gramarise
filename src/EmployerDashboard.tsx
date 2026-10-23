
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sprout,
  BriefcaseBusiness,
  Plus,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from './supabase'
import './EmployerDashboard.css'

type EmployerJob = {
  id: number
  title: string
  company: string
  location: string
  type: string
  status: string
  created_at: string
}

function EmployerDashboard() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [jobs, setJobs] = useState<EmployerJob[]>([])
  const [loading, setLoading] = useState(true)
  const [jobsError, setJobsError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        navigate('/login', { replace: true })
        return
      }

      if (!active) return
      setEmail(data.user.email ?? '')

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, company, location, type, status, created_at')
        .eq('employer_id', data.user.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (jobError) {
        setJobsError(jobError.message)
      } else {
        setJobs((jobData ?? []) as EmployerJob[])
      }

      setLoading(false)
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [navigate])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <main className="employer-dashboard">
      <header className="employer-header">
        <Link to="/" className="employer-brand">
          <Sprout size={28} />
          <span>GramaRise</span>
        </Link>

        <button className="employer-logout" onClick={handleLogout}>
          <LogOut size={17} /> Log out
        </button>
      </header>

      <section className="employer-content">
        <Link to="/jobs" className="employer-back">
          <ArrowLeft size={17} /> Browse jobs
        </Link>

        <p className="employer-eyebrow">EMPLOYER WORKSPACE</p>
        <h1>Your dashboard</h1>
        <p className="employer-description">
          Manage your hiring activities and discover local talent in Kadupassery.
        </p>

        <section className="employer-account-card">
          <span className="employer-account-icon">
            <BriefcaseBusiness size={25} />
          </span>
          <div>
            <h2>Account details</h2>
            <p>{email}</p>
            <span className="employer-status">Signed in</span>
          </div>
        </section>

        <section className="employer-action-card">
          <div className="employer-action-icon">
            <Plus size={25} />
          </div>
          <h2>Post a job vacancy</h2>
          <p>Share an employment opportunity with your local community.</p>
          <button
            className="employer-primary-button"
            onClick={() => navigate('/employer/post-job')}
          >
            Create job listing <Plus size={17} />
          </button>
        </section>

        <section className="employer-action-card">
          <h2>My job listings ({jobs.length})</h2>
          <p>Track the status of vacancies submitted from your account.</p>

          {loading && <p>Loading your job listings...</p>}

          {jobsError && (
            <p role="alert">Unable to load your listings: {jobsError}</p>
          )}

          {!loading && !jobsError && jobs.length === 0 && (
            <p>You haven't submitted any job listings yet.</p>
          )}

          {!loading && !jobsError && jobs.length > 0 && (
            <div className="employer-job-list">
              {jobs.map((job) => (
                <article className="employer-job-item" key={job.id}>
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company} · {job.location}</p>
                    <small>{job.type}</small>
                  </div>
                  <span className={`employer-job-status status-${job.status}`}>
                    {job.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default EmployerDashboard
