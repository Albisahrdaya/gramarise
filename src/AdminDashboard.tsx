
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, ShieldCheck, Sprout, LogOut, RefreshCw } from 'lucide-react'
import { supabase } from './supabase'
import './AdminDashboard.css'

type Job = {
  id: number
  title: string
  company: string
  location: string
  type: string
  salary: string | null
  description: string | null
  status: string
  employer_id: string | null
  created_at: string
}

type EmployerApplication = {
  id: string
  business_name: string
  contact_person: string
  business_email: string
  business_phone: string
  location: string
  business_type: string
  description: string
  verification_status: 'pending' | 'approved' | 'rejected'
  admin_notes: string
  created_at: string
}


function AdminDashboard() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [employers, setEmployers] = useState<EmployerApplication[]>([])
  const [employersLoading, setEmployersLoading] = useState(false)
  const [employerWorkingId, setEmployerWorkingId] = useState<string | null>(null)
  const [employerFilter, setEmployerFilter] = useState('pending')
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('draft')

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        navigate('/login', { replace: true })
        return
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (adminError) throw adminError

      if (!adminRecord) {
        setError('Your account is not authorized to access the admin dashboard.')
        setLoading(false)
        return
      }

      const { data, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, company, location, type, salary, description, status, employer_id, created_at')
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError
      setJobs((data ?? []) as Job[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.')
    } finally {
      setLoading(false)
    }
  }, [navigate])
  
  
const loadEmployers = useCallback(async () => {
  setEmployersLoading(true)
  setError('')

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      navigate('/login', { replace: true })
      return
    }

    const { data, error: rpcError } = await supabase.rpc(
      'admin_list_employer_applications'
    )

    if (rpcError) throw rpcError

    setEmployers((data ?? []) as EmployerApplication[])
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to load employer applications.'
    )
  } finally {
    setEmployersLoading(false)
  }
}, [navigate])


  
useEffect(() => {
  loadJobs()
  loadEmployers()
}, [loadJobs, loadEmployers])


  async function reviewJob(job: Job, status: 'published' | 'rejected') {
    const action = status === 'published' ? 'approve' : 'reject'

    if (!window.confirm(`Are you sure you want to ${action} "${job.title}"?`)) {
      return
    }

    setWorkingId(job.id)
    setError('')
    setNotice('')

    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError('Your session has expired. Please log in again.')
      setWorkingId(null)
      return
    }

    // Re-check admin membership before attempting the update.
    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (adminError || !adminRecord) {
      setError('Administrator verification failed. No changes were made.')
      setWorkingId(null)
      return
    }

    const { data, error: updateError } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', job.id)
      .eq('status', job.status)
      .select('id, status')

    if (updateError) {
      setError(updateError.message)
    } else if (!data || data.length === 0) {
      setError('The job was not updated. Check your database permissions or refresh the list.')
    } else {
      setNotice(`"${job.title}" has been ${action === 'approve' ? 'approved and published' : 'rejected'}.`)
      await loadJobs()
    }

    setWorkingId(null)
  }
  
async function reviewEmployer(
  employer: EmployerApplication,
  decision: 'approved' | 'rejected'
) {
  const action = decision === 'approved' ? 'approve' : 'reject'

  if (
    !window.confirm(
      `Are you sure you want to ${action} "${employer.business_name}"?`
    )
  ) {
    return
  }

  setEmployerWorkingId(employer.id)
  setError('')
  setNotice('')

  try {
    const { error: rpcError } = await supabase.rpc(
      'admin_review_employer',
      {
        target_employer_id: employer.id,
        decision,
        note: adminNotes[employer.id] ?? '',
      }
    )

    if (rpcError) throw rpcError

    setNotice(
      `${employer.business_name} has been ${decision}.`
    )

    await loadEmployers()
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : `Unable to ${action} employer application.`
    )
  } finally {
    setEmployerWorkingId(null)
  }
}


  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      return
    }
    navigate('/login', { replace: true })
  }

  const visibleJobs = jobs.filter((job) => filter === 'all' || job.status === filter)

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-brand">
          <Sprout size={28} /> GramaRise
        </Link>
        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={17} /> Log out
        </button>
      </header>

      <section className="admin-content">
        <Link to="/employer/dashboard" className="admin-back">
          <ArrowLeft size={17} /> Employer dashboard
        </Link>

        <p className="admin-eyebrow"><ShieldCheck size={15} /> ADMINISTRATION</p>
        <h1>Job approval centre</h1>
        <p className="admin-intro">
          Review job submissions before they become visible to the GramaRise community.
        </p>

        <div className="admin-stats">
          <div><span>Pending review</span><strong>{jobs.filter((j) => j.status === 'draft').length}</strong></div>
          <div><span>Published</span><strong>{jobs.filter((j) => j.status === 'published').length}</strong></div>
          <div><span>Rejected</span><strong>{jobs.filter((j) => j.status === 'rejected').length}</strong></div>
        </div>

        <div className="admin-toolbar">
          <label>
            Show
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="draft">Pending review</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
              <option value="closed">Closed</option>
              <option value="all">All jobs</option>
            </select>
          </label>
          <button className="admin-refresh" onClick={loadJobs} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && <p className="admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}

        {loading && <p>Loading job submissions...</p>}

        {!loading && !error && visibleJobs.length === 0 && (
          <div className="admin-empty">
            <ShieldCheck size={32} />
            <h2>No jobs in this category</h2>
            <p>Try another filter or refresh to check for new submissions.</p>
          </div>
        )}

        {!loading && !error && visibleJobs.map((job) => (
          <article className="admin-job-card" key={job.id}>
            <div className="admin-job-heading">
              <div>
                <span className={`admin-status status-${job.status}`}>{job.status}</span>
                <h2>{job.title}</h2>
                <p className="admin-company">{job.company}</p>
              </div>
              <span className="admin-job-type">{job.type}</span>
            </div>

            <p><strong>Location:</strong> {job.location}</p>
            <p><strong>Salary:</strong> {job.salary || 'Not specified'}</p>
            <p className="admin-description">{job.description || 'No description provided.'}</p>
            <p className="admin-date">
              Submitted {new Date(job.created_at).toLocaleString()}
            </p>

            {job.status === 'draft' && (
              <div className="admin-actions">
                <button
                  className="admin-approve"
                  disabled={workingId === job.id}
                  onClick={() => reviewJob(job, 'published')}
                >
                  <Check size={17} /> Approve & publish
                </button>
                <button
                  className="admin-reject"
                  disabled={workingId === job.id}
                  onClick={() => reviewJob(job, 'rejected')}
                >
                  <X size={17} /> Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
      
<div className="employer-review-section">
  <div className="employer-review-heading">
    <div>
      <p className="admin-eyebrow">
        <ShieldCheck size={15} /> BUSINESS VERIFICATION
      </p>
      <h2>Employer verification centre</h2>
      <p className="admin-intro">
        Verify local businesses before they can access employer features.
      </p>
    </div>

    <button
      className="admin-refresh"
      onClick={loadEmployers}
      disabled={employersLoading}
    >
      <RefreshCw size={16} />
      Refresh employers
    </button>
  </div>

  <div className="admin-stats">
    <div>
      <span>Pending employers</span>
      <strong>
        {employers.filter((e) => e.verification_status === 'pending').length}
      </strong>
    </div>
    <div>
      <span>Approved employers</span>
      <strong>
        {employers.filter((e) => e.verification_status === 'approved').length}
      </strong>
    </div>
    <div>
      <span>Rejected employers</span>
      <strong>
        {employers.filter((e) => e.verification_status === 'rejected').length}
      </strong>
    </div>
  </div>

  <div className="admin-toolbar">
    <label>
      Show employers
      <select
        value={employerFilter}
        onChange={(event) => setEmployerFilter(event.target.value)}
      >
        <option value="pending">Pending review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="all">All employers</option>
      </select>
    </label>
  </div>

  {employersLoading && <p>Loading employer applications...</p>}

  {!employersLoading &&
    employers.filter(
      (employer) =>
        employerFilter === 'all' ||
        employer.verification_status === employerFilter
    ).length === 0 && (
      <div className="admin-empty">
        <ShieldCheck size={32} />
        <h3>No employer applications found</h3>
        <p>Try another filter or refresh the list.</p>
      </div>
    )}

  {!employersLoading &&
    employers
      .filter(
        (employer) =>
          employerFilter === 'all' ||
          employer.verification_status === employerFilter
      )
      .map((employer) => (
        <article className="admin-job-card" key={employer.id}>
          <div className="admin-job-heading">
            <div>
              <span
                className={`admin-status status-${employer.verification_status}`}
              >
                {employer.verification_status}
              </span>
              <h3>{employer.business_name}</h3>
              <p className="admin-company">{employer.business_type}</p>
            </div>
          </div>

          <p><strong>Contact person:</strong> {employer.contact_person}</p>
          <p><strong>Business email:</strong> {employer.business_email}</p>
          <p><strong>Phone:</strong> {employer.business_phone}</p>
          <p><strong>Location:</strong> {employer.location}</p>
          <p>
            <strong>Description:</strong>{' '}
            {employer.description || 'No description provided.'}
          </p>
          <p className="admin-date">
            Submitted {new Date(employer.created_at).toLocaleString()}
          </p>

          {employer.verification_status === 'pending' && (
            <>
              <label className="employer-note-label">
                Admin review note (optional)
                <textarea
                  value={adminNotes[employer.id] ?? ''}
                  maxLength={1000}
                  rows={3}
                  placeholder="Enter feedback for this employer..."
                  onChange={(event) =>
                    setAdminNotes((previous) => ({
                      ...previous,
                      [employer.id]: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="admin-actions">
                <button
                  className="admin-approve"
                  disabled={employerWorkingId === employer.id}
                  onClick={() => reviewEmployer(employer, 'approved')}
                >
                  <Check size={17} /> Approve employer
                </button>
                <button
                  className="admin-reject"
                  disabled={employerWorkingId === employer.id}
                  onClick={() => reviewEmployer(employer, 'rejected')}
                >
                  <X size={17} /> Reject employer
                </button>
              </div>
            </>
          )}

          {employer.verification_status !== 'pending' &&
            employer.admin_notes && (
              <p><strong>Admin note:</strong> {employer.admin_notes}</p>
            )}
        </article>
      ))}
</div>

    </main>
  )
}

export default AdminDashboard
