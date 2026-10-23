
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './EmployerRegistration.css'

type EmployerForm = {
  business_name: string
  contact_person: string
  business_email: string
  business_phone: string
  location: string
  business_type: string
  description: string
}

const initialForm: EmployerForm = {
  business_name: '',
  contact_person: '',
  business_email: '',
  business_phone: '',
  location: 'Kadupassery',
  business_type: '',
  description: '',
}

function EmployerRegistration() {
  const navigate = useNavigate()

  const [form, setForm] = useState<EmployerForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [existingStatus, setExistingStatus] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadEmployerProfile() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError || !authData.user) {
          navigate('/login')
          return
        }

        const { data, error: profileError } = await supabase
          .from('employer_profiles')
          .select(
            'business_name, contact_person, business_email, business_phone, location, business_type, description, verification_status'
          )
          .eq('id', authData.user.id)
          .maybeSingle()

        if (!active) return

        if (profileError) {
          setError('Could not load your application: ' + profileError.message)
          return
        }

        if (data) {
          setForm({
            business_name: data.business_name,
            contact_person: data.contact_person,
            business_email: data.business_email,
            business_phone: data.business_phone,
            location: data.location,
            business_type: data.business_type,
            description: data.description ?? '',
          })
          setExistingStatus(data.verification_status)
        }
      } catch (err) {
        if (!active) return
        console.error(err)
        setError('Something went wrong while loading your application.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadEmployerProfile()

    return () => {
      active = false
    }
  }, [navigate])

  function updateField(
    field: keyof EmployerForm,
    value: string
  ) {
    setForm(current => ({ ...current, [field]: value }))
    setError('')
    setNotice('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError('Please log in before registering your business.')
        return
      }

      const cleanedForm: EmployerForm = {
        business_name: form.business_name.trim(),
        contact_person: form.contact_person.trim(),
        business_email: form.business_email.trim().toLowerCase(),
        business_phone: form.business_phone.trim(),
        location: form.location.trim(),
        business_type: form.business_type.trim(),
        description: form.description.trim(),
      }

      if (
        cleanedForm.business_name.length < 2 ||
        cleanedForm.contact_person.length < 2 ||
        cleanedForm.business_email.length < 5 ||
        cleanedForm.business_phone.length < 7 ||
        cleanedForm.location.length < 2 ||
        cleanedForm.business_type.length < 2
      ) {
        setError('Please complete all required fields correctly.')
        return
      }

      if (existingStatus === 'approved') {
        setError('Your business is already verified.')
        return
      }

      if (existingStatus === 'rejected') {
        setError(
          'Your application was rejected. Please contact the administrator before resubmitting.'
        )
        return
      }

      if (existingStatus === 'pending') {
        const { error: updateError } = await supabase
          .from('employer_profiles')
          .update(cleanedForm)
          .eq('id', authData.user.id)

        if (updateError) {
          setError('Unable to update your application: ' + updateError.message)
          return
        }

        setForm(cleanedForm)
        setNotice('Your pending application has been updated.')
        return
      }

      const { error: insertError } = await supabase
        .from('employer_profiles')
        .insert({
          id: authData.user.id,
          ...cleanedForm,
        })

      if (insertError) {
        setError('Unable to submit your application: ' + insertError.message)
        return
      }

      setForm(cleanedForm)
      setExistingStatus('pending')
      setNotice('Application submitted! Your status is pending verification.')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="employer-registration-page">
        <p className="employer-loading">Loading your application...</p>
      </main>
    )
  }

  return (
    <main className="employer-registration-page">
      <header className="employer-registration-header">
        <Link to="/" className="employer-registration-brand">
          GramaRise
        </Link>

        <nav>
          <Link to="/jobs">Find Jobs</Link>
          <Link to="/profile">My Profile</Link>
        </nav>
      </header>

      <section className="employer-registration-hero">
        <p className="employer-registration-eyebrow">
          BUILD OPPORTUNITIES LOCALLY
        </p>
        <h1>Register your business</h1>
        <p>
          Connect your business with local talent and help create
          employment opportunities in your community.
        </p>
      </section>

      <section className="employer-registration-content">
        <div className="employer-registration-card">
          <div className="employer-registration-card-heading">
            <h2>Business details</h2>
            <p>
              Submit accurate information. An administrator will review
              your application before granting employer privileges.
            </p>
          </div>

          {existingStatus && (
            <div className={`employer-review-status status-${existingStatus}`}>
              <strong>Verification status: </strong>
              {existingStatus === 'pending'
                ? 'Pending review'
                : existingStatus === 'approved'
                  ? 'Approved'
                  : 'Rejected'}
            </div>
          )}

          {error && (
            <p className="employer-form-error" role="alert">{error}</p>
          )}

          {notice && (
            <p className="employer-form-notice" role="status">{notice}</p>
          )}

          {existingStatus !== 'rejected' && existingStatus !== 'approved' && (
            <form
              className="employer-registration-form"
              onSubmit={handleSubmit}
            >
              <label>
                Business name *
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.business_name}
                  onChange={e => updateField('business_name', e.target.value)}
                  placeholder="e.g. Kadupassery Digital Solutions"
                />
              </label>

              <label>
                Contact person *
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.contact_person}
                  onChange={e => updateField('contact_person', e.target.value)}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Business email *
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.business_email}
                  onChange={e => updateField('business_email', e.target.value)}
                  placeholder="business@example.com"
                />
              </label>

              <label>
                Business phone *
                <input
                  required
                  type="tel"
                  minLength={7}
                  maxLength={25}
                  value={form.business_phone}
                  onChange={e => updateField('business_phone', e.target.value)}
                  placeholder="Business contact number"
                />
              </label>

              <label>
                Business location *
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.location}
                  onChange={e => updateField('location', e.target.value)}
                  placeholder="Village, town or district"
                />
              </label>

              <label>
                Business type *
                <select
                  required
                  value={form.business_type}
                  onChange={e => updateField('business_type', e.target.value)}
                >
                  <option value="">Select business type</option>
                  <option value="Technology">Technology / IT</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Retail">Retail / Shop</option>
                  <option value="Hospitality">Hospitality / Tourism</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education / Training</option>
                  <option value="Construction">Construction / Real Estate</option>
                  <option value="Professional Services">Professional services</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                About your business
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe your business and the opportunities you may offer..."
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="employer-submit-button"
              >
                {submitting
                  ? 'Submitting...'
                  : existingStatus === 'pending'
                    ? 'Update application'
                    : 'Submit for verification'}
              </button>
            </form>
          )}

          {existingStatus === 'approved' && (
            <p>
              Your business has been approved. Employer features will be
              available when the protected employer permissions are enabled.
            </p>
          )}

          {existingStatus === 'rejected' && (
            <p>
              Please contact the GramaRise administrator to discuss your
              application.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default EmployerRegistration
