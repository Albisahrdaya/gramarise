
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import OpportunityPage from './OpportunityPage'
import AuthPage from './AuthPage'
import EmployerDashboard from './EmployerDashboard'
import PostJobPage from './PostJobPage'
import AdminDashboard from './AdminDashboard'
import MyApplications from './MyApplications'
import EmployerApplications from './EmployerApplications'
import ProfilePage from './ProfilePage'
import TalentDirectory from './TalentDirectory'
import ReceivedRequests from './ReceivedRequests'
import EmployerRegistration from './EmployerRegistration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<OpportunityPage type="Jobs" />} />
        <Route path="/talent" element={<TalentDirectory />} />
        <Route path="/land" element={<OpportunityPage type="Land & Property" />} />
        <Route path="/businesses" element={<OpportunityPage type="Local Businesses" />} />
         <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/post-job" element={<PostJobPage />} />
        <Route path="/received-requests" element={<ReceivedRequests />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employer/register" element={<EmployerRegistration />} />
        <Route
  path="/employer/applications"
  element={<EmployerApplications />}
/>

        <Route path="*" element={<OpportunityPage type="Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
