import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';

import Login from './pages/Login/Login';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import Dashboard from './pages/Dashboard/Dashboard';
import WorkPlan from './pages/WorkPlan/WorkPlan';
import PlanDetail from './pages/PlanDetail/PlanDetail';
import Meetings from './pages/Meetings/Meetings';
import ThoughtPad from './pages/ThoughtPad/ThoughtPad';
import Notifications from './pages/Notifications/Notifications';
import Reporting from './pages/Reporting/Reporting';
import Analytics from './pages/Analytics/Analytics';
import UserProfile from './pages/UserProfile/UserProfile';
import AdminLandingPage from './pages/UserManagement/AdminLandingPage';
import UserManagement from './pages/UserManagement/UserManagement';
import Training from './pages/Admin/Training/Training';
import TemplateManagement from './pages/Admin/Templates/TemplateManagement';
import SftpManagement from './pages/Admin/SFTP/SftpManagement';
import CompanyManagement from './pages/Admin/Company/CompanyManagement';
import CronManagement from './pages/Admin/Cron/CronManagement';
import AnalyticsAdmin from './pages/Analytics/AnalyticsAdmin';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/work-plan" element={<WorkPlan />} />
                <Route path="/plan/:planId" element={<PlanDetail />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/thoughtpad" element={<ThoughtPad />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reporting" element={<Reporting />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/userprofile" element={<UserProfile />} />
                <Route path="/adminLandingPage" element={<AdminLandingPage />} />
                <Route path="/userManagement" element={<UserManagement />} />
                <Route path="/training/:type" element={<Training />} />
                <Route path="/templatemanagement" element={<TemplateManagement />} />
                <Route path="/sftpAdmin" element={<SftpManagement />} />
                <Route path="/companymanagement" element={<CompanyManagement />} />
                <Route path="/cronmanagement" element={<CronManagement />} />
                <Route path="/analyticsAdmin" element={<AnalyticsAdmin />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
