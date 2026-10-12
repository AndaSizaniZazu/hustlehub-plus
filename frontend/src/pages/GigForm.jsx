import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const empty = { title: '', description: '', category: '', price: '' };

export default function GigForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/gigs/${id}`)
      .then(({ data }) => setForm({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
      }))
      .catch(() => setErrors(['Could not load gig']));
  }, [id]);

  const validateForm = () => {
    const problems = [];
    if (!form.title.trim()) problems.push('Title is required');
    if (!form.description.trim()) problems.push('Description is required');
    if (!form.category.trim()) problems.push('Category is required');
    const price = Number(form.price);
    if (!price || price < 1 || price > 100000) problems.push('Price must be between 1 and 100000');
    return problems;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problems = validateForm();
    if (problems.length) return setErrors(problems);

    setErrors([]);
    setSubmitting(true);
    const payload = { ...form, price: Number(form.price) };
    try {
      if (id) {
        await api.put(`/gigs/${id}`, payload);
      } else {
        await api.post('/gigs', payload);
      }
      navigate('/freelancer');
    } catch (err) {
      if (err.response?.status === 403) {
        setErrors(['You can only edit your own gigs']);
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors.map((x) => x.message));
      } else {
        setErrors(['Could not save gig']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      <h2>{id ? 'Edit gig' : 'Create gig'}</h2>

      <label htmlFor="title">Title</label>
      <input id="title" value={form.title} onChange={update('title')} maxLength={100} />

      <label htmlFor="description">Description</label>
      <textarea id="description" value={form.description} onChange={update('description')} maxLength={2000} />

      <label htmlFor="category">Category</label>
      <input id="category" value={form.category} onChange={update('category')} maxLength={50} />

      <label htmlFor="price">Price (R)</label>
      <input id="price" type="number" min="1" value={form.price} onChange={update('price')} />

      {errors.length > 0 && (
        <ul role="alert" className="error">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}
      <button type="submit" disabled={submitting}>{id ? 'Save changes' : 'Create gig'}</button>
    </form>
  );
}
