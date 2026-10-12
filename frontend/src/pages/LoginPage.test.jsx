import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const loginMock = vi.fn();
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: loginMock }) }));

const renderPage = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

beforeEach(() => loginMock.mockReset());

test('renders email and password fields', () => {
  renderPage();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('shows error on empty submit and does not call login', async () => {
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  expect(loginMock).not.toHaveBeenCalled();
});

test('shows generic error on bad credentials', async () => {
  loginMock.mockRejectedValueOnce({ response: { status: 401 } });
  renderPage();
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
  await userEvent.click(screen.getByRole('button', { name: /log in/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
});
