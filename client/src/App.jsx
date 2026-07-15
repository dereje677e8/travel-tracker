import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AthletesListPage from './pages/AthletesListPage.jsx';
import AthleteDetailPage from './pages/AthleteDetailPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ActivityLogPage from './pages/ActivityLogPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout title="Dashboard" />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          <Route element={<Layout title="Athletes" />}>
            <Route path="/athletes" element={<AthletesListPage />} />
          </Route>
          <Route element={<Layout title="Athlete Detail" />}>
            <Route path="/athletes/:id" element={<AthleteDetailPage />} />
          </Route>
          <Route element={<Layout title="Calendar" />}>
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
          <Route element={<Layout title="Reports" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<Layout title="Activity Log" />}>
            <Route path="/activity" element={<ActivityLogPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['administrator']} />}>
          <Route element={<Layout title="Users" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Routes>
    </SocketProvider>
  );
}
