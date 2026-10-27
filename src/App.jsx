import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import ItineraryBuilder from "./pages/ItineraryBuilder";
import ItineraryView from "./pages/ItineraryView";
import BudgetView from "./pages/BudgetView";
import PublicTrip from "./pages/PublicTrip";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import TripCalendar from "./pages/TripCalendar";
import GroupTripView from "./pages/GroupTripView";
import AppShell from "./components/AppShell";
import AdminDashboard from "./pages/admin/AdminDashboard";

const isAdminUser = (user) => user?.email?.toLowerCase() === "admin@globetrotter.com";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center font-['IBM_Plex_Mono'] text-muted">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdminUser(user)) return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoleGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center font-['IBM_Plex_Mono'] text-muted">Loading Admin...</div>;
  
  // Enforce standard admin credentials
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (isAdminUser(user)) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const appShell = (element) => <AppShell>{element}</AppShell>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoleGuard>
              <AdminDashboard />
            </AdminRoleGuard>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route path="/trip/public/:slug" element={appShell(<PublicTrip />)} />

        <Route
          path="/dashboard"
          element={<Protected>{appShell(<Dashboard />)}</Protected>}
        />
        <Route
          path="/trips"
          element={appShell(
            <Protected>
              <MyTrips />
            </Protected>
          )}
        />
        <Route
          path="/community"
          element={appShell(
            <Protected>
              <Community />
            </Protected>
          )}
        />
        <Route
          path="/profile"
          element={<Protected>{appShell(<Profile />)}</Protected>}
        />
        <Route
          path="/trips/new"
          element={<Protected>{appShell(<CreateTrip />)}</Protected>}
        />
        <Route
          path="/trips/:tripId"
          element={<Protected>{appShell(<ItineraryView />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/edit"
          element={<Protected>{appShell(<ItineraryBuilder />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/build"
          element={<Protected>{appShell(<ItineraryBuilder />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/view"
          element={<Protected>{appShell(<ItineraryView />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/budget"
          element={<Protected>{appShell(<BudgetView />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/group"
          element={<Protected>{appShell(<GroupTripView />)}</Protected>}
        />
        <Route
          path="/trips/:tripId/calendar"
          element={<Protected>{appShell(<TripCalendar />)}</Protected>}
        />
        <Route
          path="/calendar"
          element={<Protected>{appShell(<TripCalendar />)}</Protected>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
