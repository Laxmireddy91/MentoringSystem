import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ActivateAccountPage from '../pages/auth/ActivateAccountPage';
import axiosClient from '../api/axiosClient';

vi.mock('../api/axiosClient', () => ({
  default: { post: vi.fn() }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useSearchParams: () => [new URLSearchParams('tab=student')] };
});

describe('ActivateAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <ActivateAccountPage />
      </BrowserRouter>
    );
  };

  it('renders activation form with tabs', () => {
    renderComponent();
    expect(screen.getByText('Activate Institutional Account')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Faculty/Staff')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
  });

  it('submits student activation successfully', async () => {
    axiosClient.post.mockResolvedValueOnce({
      message: 'Account activated successfully'
    });

    renderComponent();
    
    // Fill student form
    fireEvent.change(screen.getByPlaceholderText('1MS21CS001'), { target: { value: '1MS23CS999' } });
    fireEvent.change(screen.getByPlaceholderText('student@college.edu'), { target: { value: 'student@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'Password@123' } });

    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/auth/activate/student', {
        usn: '1MS23CS999',
        email: 'student@test.com',
        password: 'Password@123',
        confirmPassword: 'Password@123'
      });
      // The component renders a success alert
      expect(screen.getByText('Activation Successful')).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    renderComponent();
    
    fireEvent.change(screen.getByPlaceholderText('1MS21CS001'), { target: { value: '1MS23CS999' } });
    fireEvent.change(screen.getByPlaceholderText('student@college.edu'), { target: { value: 'student@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), { target: { value: 'Password@123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), { target: { value: 'Wrong@123' } });

    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(axiosClient.post).not.toHaveBeenCalled();
    });
  });
});
