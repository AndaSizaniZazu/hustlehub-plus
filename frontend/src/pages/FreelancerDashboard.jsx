import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';

const rand = (value) => `R ${Number(value || 0).toLocaleString('en-ZA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
const percent = (rate) => `${(Number(rate || 0) * 100).toFixed(1)}%`;

// income per month (oldest first) from the freelancer's transactions
const monthlyIncome = (transactions) => {
  const totals = new Map();
  [...transactions]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((t) => {
      const month = new Date(t.createdAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
      totals.set(month, (totals.get(month) || 0) + t.amount);
    });
  return [...totals].map(([month, amount]) => ({ month, amount }));
};

export default function FreelancerDashboard() {
  const [gigs, setGigs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState({ totalIncome: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/gigs/mine'),
      api.get('/bookings/freelancer'),
      api.get('/transactions/income'),
      api.get('/transactions/mine'),
    ])
      .then(([g, b, i, t]) => {
        setGigs(g.data);
        setBookings(b.data);
        setIncome(i.data);
        setTransactions(t.data);
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

  const summary = [
    { name: 'Income', value: income.totalIncome, color: '#1e3a8a' },
    { name: 'Estimated tax', value: income.estimatedTax, color: '#b91c1c' },
    { name: 'Net income', value: income.netIncome, color: '#15803d' },
  ];
  const months = monthlyIncome(transactions);

  return (
    <section>
      {error && <p role="alert" className="error">{error}</p>}

      <div className="stats">
        <div><h3>Total income</h3><p>{rand(income.totalIncome)}</p></div>
        <div><h3>Estimated tax</h3><p>{rand(income.estimatedTax)}</p></div>
        <div><h3>Net income</h3><p>{rand(income.netIncome)}</p></div>
        <div><h3>Effective tax rate</h3><p>{percent(income.effectiveRate)}</p></div>
        <div><h3>Bookings</h3><p>{income.bookings}</p></div>
      </div>

      <div className="tax-panel" aria-label="Income and tax summary">
        <h2>Income and tax</h2>
        <p className="tax-note">
          SARS {income.taxYear} tax year estimate. Your marginal rate is {percent(income.marginalRate)}.
        </p>
        <div className="chart-grid">
          <div className="chart">
            <h3>Income vs tax</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `R${v}`} width={70} />
                <Tooltip formatter={(v) => rand(v)} />
                <Bar dataKey="value" name="Amount">
                  {summary.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart">
            <h3>Income by month</h3>
            {months.length === 0 ? <p>No income yet.</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={months}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `R${v}`} width={70} />
                  <Tooltip formatter={(v) => rand(v)} />
                  <Bar dataKey="amount" name="Income" fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <details className="tax-how">
          <summary>How is this calculated?</summary>
          <ol>
            <li>Your total gig income is treated as taxable income ({rand(income.totalIncome)}).</li>
            <li>The SARS bracket for that income gives the tax before rebates ({rand(income.grossTax)}).</li>
            <li>The primary rebate is subtracted ({rand(income.rebate)}). Tax is never below R 0.</li>
            <li>Net income = income − estimated tax.</li>
          </ol>
          <p className="tax-note">
            This is an estimate only. It ignores deductions, medical credits, age rebates and provisional tax.
          </p>
        </details>
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
