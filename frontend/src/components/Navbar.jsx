import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/gigs" className="brand">HustleHub+</Link>
      <div className="nav-links">
        <Link to="/gigs">Browse gigs</Link>
        {user?.role === 'client' && <Link to="/client">My bookings</Link>}
        {user?.role === 'freelancer' && <Link to="/freelancer">Dashboard</Link>}
        {user ? (
          <>
            <span>Hi, {user.name}</span>
            <button onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
