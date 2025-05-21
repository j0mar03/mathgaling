import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom'; // Needed for Link component
import { AuthProvider, useAuth } from '../../context/AuthContext'; // Import AuthProvider and useAuth
import Login from './Login';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'), // Use actual AuthProvider
  useAuth: jest.fn(), // Mock the hook itself
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Use actual BrowserRouter, Link etc.
  useNavigate: () => mockedNavigate, // Mock useNavigate
}));


describe('Login Component', () => {
  let mockLogin;

  beforeEach(() => {
    // Reset mocks before each test
    mockLogin = jest.fn();
    mockedNavigate.mockClear();
    // Provide the mock implementation for useAuth
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin, // Provide the mock login function
      logout: jest.fn(),
      signup: jest.fn(),
    });
  });

  const renderComponent = () => {
    render(
      <AuthProvider> {/* Need AuthProvider because Login uses useAuth */}
        <BrowserRouter> {/* Need BrowserRouter because Login uses Link */}
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );
  };

  test('renders login form', () => {
    renderComponent();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account?/i)).toBeInTheDocument();
  });

  test('shows error message for empty fields', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for error message to appear
    expect(await screen.findByText(/please enter both email and password/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('calls login function and navigates on successful login', async () => {
    // Mock a successful login response
    const mockUserData = { id: 1, auth_id: 'test@example.com' };
    const mockRole = 'student';
    mockLogin.mockResolvedValue({
        message: 'Login successful',
        token: 'fake-token',
        user: mockUserData,
        role: mockRole
    });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for login function to be called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
    });

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith(`/${mockRole}`);
    });
  });

   test('shows error message on failed login', async () => {
    // Mock a failed login response
    const errorMessage = 'Invalid credentials.';
    mockLogin.mockRejectedValue({ response: { data: { error: errorMessage } } });

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for login function to be called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    });

    // Check for error message
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

});