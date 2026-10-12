import { useEffect, useState } from 'react';
import api from '../api';

export default function ClientDashboard() {
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/bookings/mine'), api.get('/transactions/mine')])
      .then(([b, t]) => {
        setBookings(b.data);
        setTransactions(t.data);
      })
      .catch(() => setError('Could not load your dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p role="alert" className="error">{error}</p>;

  return (
    <section>
      <h2>My bookings</h2>
      {bookings.length === 0 ? <p>No bookings yet.</p> : (
        <table>
          <thead>
            <tr><th>Gig</th><th>Freelancer</th><th>Price</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td>{b.gig?.title ?? 'Gig removed'}</td>
                <td>{b.freelancer?.name}</td>
                <td>R {b.priceAtBooking.toFixed(2)}</td>
                <td>{b.status}</td>
                <td>{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>My transactions</h2>
      {transactions.length === 0 ? <p>No transactions yet.</p> : (
        <table>
          <thead>
            <tr><th>Reference</th><th>Gig</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td>{t.reference}</td>
                <td>{t.booking?.gig?.title ?? '-'}</td>
                <td>R {t.amount.toFixed(2)}</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
