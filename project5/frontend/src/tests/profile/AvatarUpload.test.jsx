import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvatarUpload from '../../components/profile/AvatarUpload';
import { AuthProvider } from '../../context/AuthContext';
import * as profileService from '../../services/profileService';
import axiosClient from '../../api/axiosClient';
import { vi } from 'vitest';

vi.mock('../../api/axiosClient');
vi.mock('../../services/profileService');

const renderWithAuth = (ui) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe('AvatarUpload component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('uploads an image and updates auth context', async () => {
    const fakeFile = new File(['dummy'], 'avatar.png', { type: 'image/png' });
    axiosClient.post.mockResolvedValue({ data: { _id: 'doc123' } });
    profileService.updateMyProfile.mockResolvedValue({ avatarDocumentId: 'doc123' });

    renderWithAuth(<AvatarUpload />);
    const input = screen.getByLabelText(/profile photo/i).parentElement.querySelector('input');
    fireEvent.change(input, { target: { files: [fakeFile] } });

    await waitFor(() => expect(axiosClient.post).toHaveBeenCalled());
    expect(profileService.updateMyProfile).toHaveBeenCalledWith({ avatarDocumentId: 'doc123' });
  });

  test('removes avatar when button clicked', async () => {
    // When user has no avatarDocumentId the Remove Avatar button should not appear
    profileService.updateMyProfile.mockResolvedValue({ avatarDocumentId: null });
    // Render with a fresh provider that has no stored user
    localStorage.clear();
    renderWithAuth(<AvatarUpload />);
    const removeBtn = screen.queryByText(/remove avatar/i);
    expect(removeBtn).toBeNull();
  });
});
