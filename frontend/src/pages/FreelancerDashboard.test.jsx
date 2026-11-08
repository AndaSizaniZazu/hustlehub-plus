import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FreelancerDashboard from './FreelancerDashboard';
import api from '../api';

vi.mock('../api', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const responses = {
  '/gigs/mine': [],
  '/bookings/freelancer': [],
  '/transactions/income': {
    totalIncome: 300000,
    bookings: 2,
    estimatedTax: 40569,
    netIncome: 259431,
    grossTax: 58389,
    rebate: 17820,
    marginalRate: 0.26,
    effectiveRate: 0.1352,
    taxYear: '2027',
  },
  '/transactions/mine': [
    { _id: 't1', amount: 100000, createdAt: '2026-09-10T10:00:00Z' },
    { _id: 't2', amount: 200000, createdAt: '2026-10-10T10:00:00Z' },
  ],
};

beforeEach(() => {
  api.get.mockImplementation((url) => Promise.resolve({ data: responses[url] }));
});

test('shows income, estimated tax, net income and effective rate', async () => {
  render(<MemoryRouter><FreelancerDashboard /></MemoryRouter>);
  expect(await screen.findByText('Estimated tax')).toBeInTheDocument();
  expect(screen.getByText('Total income').nextSibling).toHaveTextContent(/300\D000,00/);
  expect(screen.getByText('Estimated tax').nextSibling).toHaveTextContent(/40\D569,00/);
  expect(screen.getByText('Net income').nextSibling).toHaveTextContent(/259\D431,00/);
  expect(screen.getByText('13.5%')).toBeInTheDocument();
});

test('explains how the tax estimate is calculated', async () => {
  render(<MemoryRouter><FreelancerDashboard /></MemoryRouter>);
  expect(await screen.findByText('How is this calculated?')).toBeInTheDocument();
  expect(screen.getByText(/SARS 2027 tax year estimate/)).toBeInTheDocument();
  expect(screen.getByText(/marginal rate is 26.0%/)).toBeInTheDocument();
});

test('shows an error when the dashboard cannot load', async () => {
  api.get.mockRejectedValue(new Error('down'));
  render(<MemoryRouter><FreelancerDashboard /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your dashboard');
});
