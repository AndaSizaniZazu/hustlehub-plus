import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const problems = [];
    if (!form.name.trim()) problems.push('Name is required');
    if (!emailPattern.test(form.email)) problems.push('Valid email required');
    if (form.password.length < 8) problems.push('Password must be at least 8 characters');
    return problems;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problems = validateForm();
    if (problems.length) return setErrors(problems);

    setErrors([]);
    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const code = err.response?.status;
      if (!code || code >= 500) {
        setErrors(['Cannot reach the server. Please try again later.']);
      } else if (code === 429) {
        setErrors(['Too many attempts. Please try again later.']);
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors.map((x) => x.message)); // validation messages are safe to show
      } else {
        setErrors(['Registration failed']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      <h2>Create account</h2>

      <label htmlFor="name">Name</label>
      <input id="name" value={form.name} onChange={update('name')} />

      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={form.email} onChange={update('email')} />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={form.password} onChange={update('password')} />

      <label htmlFor="role">I want to</label>
      <select id="role" value={form.role} onChange={update('role')}>
        <option value="client">Hire freelancers (Client)</option>
        <option value="freelancer">Offer services (Freelancer)</option>
      </select>

      {errors.length > 0 && (
        <ul role="alert" className="error">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}
      <button type="submit" disabled={submitting}>Register</button>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
