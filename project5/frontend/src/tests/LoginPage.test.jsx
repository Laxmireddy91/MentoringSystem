import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

// Mock context and api
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));
vi.mock('../api/axiosClient', () => ({
  default: { post: vi.fn() }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: mockLogin });
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderComponent();
    expect(screen.getByText('Sign in to MentorConnect')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@college.edu or 1MS21CS001')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    axiosClient.post.mockResolvedValueOnce({
      data: {
        user: { id: 1, name: 'Test User', role: 'student' },
        token: 'fake-jwt-token'
      }
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('name@college.edu or 1MS21CS001'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockLogin).toHaveBeenCalledWith(
        { id: 1, name: 'Test User', role: 'student' },
        'fake-jwt-token'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('displays error on failed login', async () => {
    axiosClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
