
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  MapPin,
  BriefcaseBusiness,
  Clock,
  Sprout,
} from 'lucide-react'
import { supabase } from './supabase'
import './OpportunityPage.css'

type Job = {
  id: number
  title: string
  company: string
  location: string
  type: string
  salary: string | null
  description: string | null
}

type OpportunityPageProps = {
  type: string
}

function OpportunityPage({ type }: OpportunityPageProps) {
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('All')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [applicationLoading, setApplicationLoading] = useState(false)
  const [applicationError, setApplicationError] = useState('')
  const [applicationSuccess, setApplicationSuccess] = useState('')

  const isJobsPage = type === 'Jobs'

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('jobs')
        .select(
          'id, title, company, location, type, salary, description, created_at',
        )
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (!active) return

      if (error) {
        setError(error.message)
      } else {
        setJobs((data ?? []) as Job[])
      }

      setLoading(false)
    }

    loadJobs()

    return () => {
      active = false
    }
  }, [])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)

      const matchesType = jobType === 'All' || job.type === jobType

      return matchesSearch && matchesType
    })
  }, [jobs, search, jobType])

  
async function handleApply(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()

  if (!selectedJob) return

  setApplicationLoading(true)
  setApplicationError('')
  setApplicationSuccess('')

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      window.location.href = '/login'
      return
    }

    const { error: insertError } = await supabase
      .from('job_applications')
      .insert({
        job_id: selectedJob.id,
        applicant_id: userData.user.id,
        phone: phone.trim(),
        introduction: introduction.trim(),
      })

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('You have already applied for this job.')
      }

      throw insertError
    }

    setApplicationSuccess('Application submitted successfully!')
    setPhone('')
    setIntroduction('')
  } catch (err) {
    setApplicationError(
      err instanceof Error ? err.message : 'Unable to submit your application.'
    )
  } finally {
    setApplicationLoading(false)
  }
}


  return (
    <main className="opportunity-page">
      <header className="opportunity-header">
        <Link to="/" className="opportunity-brand">
          <Sprout size={29} />
          <span>GramaRise</span>
        </Link>
      </header>

      <section className="opportunity-content">
        <p className="opportunity-eyebrow">
          GROWING TOGETHER · KADUPASSERY
        </p>

        <h1>{type}</h1>

        <p className="opportunity-description">
          {isJobsPage
            ? 'Discover employment opportunities and build your career closer to home.'
            : `Discover ${type.toLowerCase()} opportunities and connect with your local community.`}
        </p>

        {isJobsPage ? (
          <>
            <div className="job-search-panel">
              <div className="job-search-input">
                <Search size={20} />

                <input
                  type="search"
                  placeholder="Search job title, company or location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search jobs"
                />
              </div>

              <select
                value={jobType}
                onChange={(event) => setJobType(event.target.value)}
                aria-label="Filter by job type"
              >
                <option value="All">All job types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="job-results-heading">
              <h2>Explore opportunities</h2>
              <span>
                {loading
                  ? 'Loading...'
                  : `${filteredJobs.length} jobs found`}
              </span>
            </div>

            {loading && (
              <p role="status">Loading jobs from GramaRise...</p>
            )}

            {error && (
              <div className="job-empty-state" role="alert">
                <h3>Unable to load jobs</h3>
                <p>{error}</p>
                <p>
                  Check your Supabase URL, publishable key, table name,
                  and database permissions.
                </p>
              </div>
            )}

            {!loading && !error && filteredJobs.length > 0 && (
              <div className="job-list">
                {filteredJobs.map((job) => (
                  <article className="job-card" key={job.id}>
                    <div className="job-card-top">
                      <div className="job-icon">
                        <BriefcaseBusiness size={23} />
                      </div>

                      <span className="job-type-badge">
                        {job.type}
                      </span>
                    </div>

                    <h3>{job.title}</h3>
                    <p className="job-company">{job.company}</p>

                    <div className="job-meta">
                      <span>
                        <MapPin size={16} />
                        {job.location}
                      </span>

                      <span>
                        <Clock size={16} />
                        {job.salary || 'Salary not specified'}
                      </span>
                    </div>

                    <p className="job-card-description">
                      {job.description || 'No description provided.'}
                    </p>

                    <button
                      className="job-apply-button"
                      onClick={() => setSelectedJob(job)}
                    >
                      View details
                    </button>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && filteredJobs.length === 0 && (
              <div className="job-empty-state">
                <Search size={30} />
                <h3>
                  {jobs.length === 0
                    ? 'No published jobs yet'
                    : 'No jobs found'}
                </h3>
                <p>
                  {jobs.length === 0
                    ? 'New opportunities will appear here when employers publish approved listings.'
                    : 'Try another keyword or select a different job type.'}
                </p>

                {(search !== '' || jobType !== 'All') && (
                  <button
                    className="job-reset-button"
                    onClick={() => {
                      setSearch('')
                      setJobType('All')
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="opportunity-placeholder">
            <Sprout size={30} />
            <h2>Something meaningful is growing.</h2>
            <p>
              This section is being developed. Soon, you will be able to
              explore opportunities and connect with your local community here.
            </p>
          </div>
        )}

        <Link to="/" className="opportunity-back-link">
          <ArrowLeft size={18} />
          Back to homepage
        </Link>
      </section>

      {selectedJob && (
        <div
          className="job-modal-backdrop"
          onClick={() => setSelectedJob(null)}
        >
          <section
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="job-modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close job details"
            >
              ×
            </button>

            <p className="opportunity-eyebrow">
              GRAMARISE OPPORTUNITY
            </p>

            <h2 id="job-modal-title">{selectedJob.title}</h2>
            <p className="job-company">{selectedJob.company}</p>

            <div className="job-modal-details">
              <p>
                <strong>Location:</strong> {selectedJob.location}
              </p>
              <p>
                <strong>Job type:</strong> {selectedJob.type}
              </p>
              <p>
                <strong>Salary:</strong>{' '}
                {selectedJob.salary || 'Salary not specified'}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {selectedJob.description || 'No description provided.'}
              </p>
            </div>

            
<form className="job-application-form" onSubmit={handleApply}>
  <h3>Apply for this job</h3>
  <p>Introduce yourself to the employer.</p>

  <label>
    Phone number
    <input
      type="tel"
      value={phone}
      onChange={(event) => setPhone(event.target.value)}
      placeholder="Enter your contact number"
      required
      maxLength={20}
    />
  </label>

  <label>
    Short introduction
    <textarea
      value={introduction}
      onChange={(event) => setIntroduction(event.target.value)}
      placeholder="Tell the employer about your skills and interest in this role."
      rows={4}
      maxLength={1500}
      required
    />
  </label>

  {applicationError && (
    <p className="auth-error" role="alert">{applicationError}</p>
  )}

  {applicationSuccess && (
    <p className="auth-message" role="status">{applicationSuccess}</p>
  )}

  <button
    className="job-apply-button"
    type="submit"
    disabled={applicationLoading || Boolean(applicationSuccess)}
  >
    {applicationLoading
      ? 'Submitting...'
      : applicationSuccess
        ? 'Application submitted'
        : 'Submit application'}
  </button>

  <p className="job-demo-note">
    Your application will be shared with the employer who posted this vacancy.
  </p>
</form>


            <button
              className="job-apply-button"
              onClick={() => setSelectedJob(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default OpportunityPage
