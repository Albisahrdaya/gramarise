
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, RefreshCw, Sprout } from 'lucide-react'
import { supabase } from './supabase'
import './ApplicationDashboards.css'

type Job = {
  id: number
  title: string
  company: string
  location: string
}

type Application = {
  id: number
  job_id: number
  applicant_id: string
  phone: string
  introduction: string
  status: string
  created_at: string
}

const statuses = [
  'submitted',
  'reviewing',
  'shortlisted',
  'rejected',
  'hired',
]

function EmployerApplications() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        navigate('/login', { replace: true })
        return
      }

      // Fetch only jobs owned by the logged-in employer.
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, company, location')
        .eq('employer_id', authData.user.id)

      if (jobError) throw jobError

      const ownedJobs = (jobData ?? []) as Job[]
      setJobs(ownedJobs)

      if (ownedJobs.length === 0) {
        setApplications([])
        return
      }

      const jobIds = ownedJobs.map((job) => job.id)

      // RLS independently restricts this query to applications
      // for jobs owned by this employer.
      const { data: applicationData, error: applicationError } =
        await supabase
          .from('job_applications')
          .select('id, job_id, applicant_id, phone, introduction, status, created_at')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })

      if (applicationError) throw applicationError

      setApplications((applicationData ?? []) as Application[])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load applications.'
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  async function updateStatus(
    application: Application,
    nextStatus: string
  ) {
    if (!statuses.includes(nextStatus)) return
    if (application.status === nextStatus) return

    const confirmed = window.confirm(
      `Change this application from "${application.status}" to "${nextStatus}"?`
    )

    if (!confirmed) return

    setUpdatingId(application.id)
    setError('')
    setNotice('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        navigate('/login', { replace: true })
        return
      }

      // Verify ownership before attempting the update.
      // Supabase RLS is still the actual security boundary.
      const { data: ownedJob, error: ownershipError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', application.job_id)
        .eq('employer_id', authData.user.id)
        .maybeSingle()

      if (ownershipError) throw ownershipError

      if (!ownedJob) {
        throw new Error('You are not authorized to manage this application.')
      }

      const { data, error: updateError } = await supabase
        .from('job_applications')
        .update({ status: nextStatus })
        .eq('id', application.id)
        .eq('job_id', application.job_id)
        .eq('status', application.status)
        .select('id, status')

      if (updateError) throw updateError

      if (!data || data.length === 0) {
        throw new Error(
          'The status was not changed. Refresh the list and try again.'
        )
      }

      setNotice(`Application status updated to "${nextStatus}".`)
      await loadApplications()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update application status.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function jobFor(application: Application) {
    return jobs.find((job) => job.id === application.job_id)
  }

  const visibleApplications = applications.filter(
    (application) =>
      filter === 'all' || application.status === filter
  )

  return (
    <main className="application-dashboard">
      <header className="application-header">
        <Link to="/" className="application-brand">
          <Sprout size={27} /> GramaRise
        </Link>
        <Link to="/employer/dashboard" className="application-nav-link">
          Employer dashboard
        </Link>
      </header>

      <section className="application-content">
        <Link to="/employer/dashboard" className="application-back">
          <ArrowLeft size={17} /> Back to employer dashboard
        </Link>

        <p className="application-eyebrow">EMPLOYER WORKSPACE</p>
        <h1>Applications Received</h1>
        <p className="application-subtitle">
          Review applicants for your job listings and update their progress.
        </p>

        <div className="received-stats">
          <div>
            <span>Your job listings</span>
            <strong>{jobs.length}</strong>
          </div>
          <div>
            <span>Total applications</span>
            <strong>{applications.length}</strong>
          </div>
          <div>
            <span>Awaiting review</span>
            <strong>
              {applications.filter((a) => a.status === 'submitted').length}
            </strong>
          </div>
        </div>

        <div className="received-toolbar">
          <label>
            Filter by status
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All applications</option>
              <option value="submitted">Submitted</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </label>

          <button
            className="received-refresh"
            onClick={loadApplications}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <p className="application-message application-error" role="alert">
            {error}
          </p>
        )}

        {notice && (
          <p className="application-message received-success" role="status">
            {notice}
          </p>
        )}

        {loading && <p>Loading applications...</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="application-empty">
            <BriefcaseBusiness size={34} />
            <h2>No applications received yet</h2>
            <p>
              Applications for your job listings will appear here when
              residents apply.
            </p>
          </div>
        )}

        {!loading && !error && applications.length > 0 &&
          visibleApplications.length === 0 && (
            <div className="application-empty">
              <h2>No applications match this filter</h2>
              <p>Choose another status to see more applications.</p>
            </div>
          )}

        {!loading && !error && visibleApplications.map((application) => {
          const job = jobFor(application)

          return (
            <article className="application-card" key={application.id}>
              <div className="application-card-heading">
                <div>
                  <h2>{job?.title ?? 'Your job listing'}</h2>
                  <p className="application-company">
                    {job?.company ?? 'Company'}
                  </p>
                </div>

                <span
                  className={`application-status status-${application.status}`}
                >
                  {application.status}
                </span>
              </div>

              <p className="received-location">
                {job?.location ?? 'Location unavailable'}
              </p>

              <div className="received-applicant-details">
                <p>
                  <strong>Applicant account ID:</strong>
                  <span>{application.applicant_id}</span>
                </p>
                <p>
                  <strong>Phone:</strong> {application.phone}
                </p>
                <p>
                  <strong>Applied:</strong>{' '}
                  {new Date(application.created_at).toLocaleString()}
                </p>
              </div>

              <div className="received-introduction">
                <h3>Applicant introduction</h3>
                <p>{application.introduction}</p>
              </div>

              <label className="received-status-control">
                Update application status
                <select
                  value={application.status}
                  disabled={updatingId === application.id}
                  onChange={(event) =>
                    updateStatus(application, event.target.value)
                  }
                >
                  {statuses.map((status) => (
                    <option value={status} key={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              {updatingId === application.id && (
                <p className="received-location">Updating status...</p>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default EmployerApplications
