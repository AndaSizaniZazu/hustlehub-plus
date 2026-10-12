import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GigsPage from './pages/GigsPage';
import GigForm from './pages/GigForm';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gigs" element={<GigsPage />} />

          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/client" element={<ClientDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['freelancer']} />}>
            <Route path="/freelancer" element={<FreelancerDashboard />} />
            <Route path="/gigs/new" element={<GigForm />} />
            <Route path="/gigs/:id/edit" element={<GigForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/gigs" replace />} />
        </Routes>
      </main>
    </>
  );
}
