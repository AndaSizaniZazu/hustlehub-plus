import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function FreelancerDashboard() {
  const [gigs, setGigs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [income, setIncome] = useState({ totalIncome: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/gigs/mine'),
      api.get('/bookings/freelancer'),
      api.get('/transactions/income'),
    ])
      .then(([g, b, i]) => {
        setGigs(g.data);
        setBookings(b.data);
        setIncome(i.data);
      })
      .catch(() => setError('Could not load your dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gig?')) return;
    try {
      await api.delete(`/gigs/${id}`);
      setGigs(gigs.filter((g) => g._id !== id));
    } catch {
      setError('Could not delete gig');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <section>
      {error && <p role="alert" className="error">{error}</p>}

      <div className="stats">
        <div><h3>Total income</h3><p>R {income.totalIncome.toFixed(2)}</p></div>
        <div><h3>Bookings</h3><p>{income.bookings}</p></div>
      </div>

      <h2>My gigs</h2>
      <Link to="/gigs/new" className="button">+ New gig</Link>
      {gigs.length === 0 ? <p>You have no gigs yet.</p> : (
        <table>
          <thead>
            <tr><th>Title</th><th>Category</th><th>Price</th><th></th></tr>
          </thead>
          <tbody>
            {gigs.map((g) => (
              <tr key={g._id}>
                <td>{g.title}</td>
                <td>{g.category}</td>
                <td>R {g.price.toFixed(2)}</td>
                <td>
                  <Link to={`/gigs/${g._id}/edit`}>Edit</Link>{' '}
                  <button onClick={() => handleDelete(g._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Bookings received</h2>
      {bookings.length === 0 ? <p>No bookings yet.</p> : (
        <table>
          <thead>
            <tr><th>Gig</th><th>Client</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.gig?.title ?? 'Gig removed'}</td>
                <td>{b.client?.name}</td>
                <td>R {b.priceAtBooking.toFixed(2)}</td>
                <td>{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
