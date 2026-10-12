import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigCard from './GigCard';

const gig = {
  _id: '1',
  title: 'Logo design',
  category: 'Design',
  description: 'Clean logos',
  price: 500,
  freelancer: { name: 'Thabo' },
};

test('renders gig details', () => {
  render(<GigCard gig={gig} canBook={false} onBook={() => {}} />);
  expect(screen.getByText('Logo design')).toBeInTheDocument();
  expect(screen.getByText('R 500.00')).toBeInTheDocument();
  expect(screen.getByText('by Thabo')).toBeInTheDocument();
});

test('hides Book button when user cannot book', () => {
  render(<GigCard gig={gig} canBook={false} onBook={() => {}} />);
  expect(screen.queryByRole('button', { name: /book/i })).not.toBeInTheDocument();
});

test('calls onBook with gig id when clicked', async () => {
  const onBook = vi.fn();
  render(<GigCard gig={gig} canBook onBook={onBook} />);
  await userEvent.click(screen.getByRole('button', { name: /book/i }));
  expect(onBook).toHaveBeenCalledWith('1');
});
