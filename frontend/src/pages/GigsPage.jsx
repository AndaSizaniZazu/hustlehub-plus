import { useEffect, useState } from 'react';
import api from '../api';
import GigCard from '../components/GigCard';
import { useAuth } from '../context/AuthContext';

export default function GigsPage() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/gigs')
      .then((res) => setGigs(res.data))
      .catch(() => setError('Could not load gigs. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (gigId) => {
    setMessage('');
    setError('');
    try {
      const { data } = await api.post('/bookings', { gigId });
      setMessage(`Booking confirmed. Reference: ${data.transaction.reference}`);
    } catch (err) {
      setError(err.response?.status === 429
        ? 'Too many bookings. Please wait a few minutes.'
        : 'Booking failed. Please try again.');
    }
  };

  if (loading) return <p>Loading gigs...</p>;

  return (
    <section>
      <h2>Available gigs</h2>
      {!user && <p>Log in as a client to book a gig.</p>}
      {message && <p className="success">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {gigs.length === 0 && !error && <p>No gigs yet.</p>}

      <div className="gig-grid">
        {gigs.map((g) => (
          <GigCard
            key={g._id}
            gig={g}
            canBook={user?.role === 'client'}
            onBook={handleBook}
          />
        ))}
      </div>
    </section>
  );
}
