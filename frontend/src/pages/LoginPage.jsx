import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      return setError('Email and password are required');
    }

    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'freelancer' ? '/freelancer' : '/gigs');
    } catch (err) {
      const code = err.response?.status;
      if (!code || code >= 500) {
        setError('Cannot reach the server. Please try again later.');
      } else if (code === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Invalid email or password'); // generic: never reveal which part was wrong
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      <h2>Log in</h2>
      {location.state?.registered && <p className="success">Account created. Please log in.</p>}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={submitting}>Log in</button>
      <p>No account? <Link to="/register">Register</Link></p>
    </form>
  );
}
