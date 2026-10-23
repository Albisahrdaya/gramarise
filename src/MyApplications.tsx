
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, Clock, Sprout } from 'lucide-react'
import { supabase } from './supabase'
import './ApplicationDashboards.css'

type Application = {
  id: number
  job_id: number
  phone: string
  introduction: string
  status: string
  created_at: string
  job: {
    title: string
    company: string
    location: string
    type: string
    salary: string | null
  } | null
}

function MyApplications() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadApplications() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        navigate('/login', { replace: true })
        return
      }

      const { data, error: queryError } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          phone,
          introduction,
          status,
          created_at,
          job:jobs (
            title,
            company,
            location,
            type,
            salary
          )
        `)
        .eq('applicant_id', authData.user.id)
        .order('created_at', { ascending: false })

      if (!active) return

      if (queryError) {
        setError(queryError.message)
      } else {
        setApplications((data ?? []) as unknown as Application[])
      }

      setLoading(false)
    }

    loadApplications()

    return () => {
      active = false
    }
  }, [navigate])

  function statusLabel(status: string) {
    return status.replace('_', ' ')
  }

  return (
    <main className="application-dashboard">
      <header className="application-header">
        <Link to="/" className="application-brand">
          <Sprout size={27} /> GramaRise
        </Link>
        <Link to="/jobs" className="application-nav-link">
          Browse jobs
        </Link>
      </header>

      <section className="application-content">
        <Link to="/jobs" className="application-back">
          <ArrowLeft size={17} /> Back to jobs
        </Link>

        <p className="application-eyebrow">YOUR CAREER JOURNEY</p>
        <h1>My Applications</h1>
        <p className="application-subtitle">
          Track your applications and see the latest status of each opportunity.
        </p>

        {loading && <p>Loading your applications...</p>}

        {error && (
          <div className="application-message application-error" role="alert">
            Unable to load applications: {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="application-empty">
            <BriefcaseBusiness size={34} />
            <h2>Your next opportunity starts here.</h2>
            <p>You haven't applied for any jobs yet.</p>
            <Link to="/jobs" className="application-primary-button">
              Explore jobs
            </Link>
          </div>
        )}

        {!loading && !error && applications.map((application) => (
          <article className="application-card" key={application.id}>
            <div className="application-card-heading">
              <div>
                <h2>{application.job?.title ?? 'Job listing no longer available'}</h2>
                <p className="application-company">
                  {application.job?.company ?? 'Company information unavailable'}
                </p>
              </div>
              <span className={`application-status status-${application.status}`}>
                {statusLabel(application.status)}
              </span>
            </div>

            {application.job && (
              <div className="application-job-meta">
                <span>{application.job.location}</span>
                <span>{application.job.type}</span>
                <span>{application.job.salary || 'Salary not specified'}</span>
              </div>
            )}

            <p className="application-date">
              <Clock size={15} />
              Applied on {new Date(application.created_at).toLocaleDateString()}
            </p>

            <details className="application-details">
              <summary>View your submitted details</summary>
              <p><strong>Phone:</strong> {application.phone}</p>
              <p><strong>Introduction:</strong> {application.introduction}</p>
            </details>
          </article>
        ))}
      </section>
    </main>
  )
}

export default MyApplications
