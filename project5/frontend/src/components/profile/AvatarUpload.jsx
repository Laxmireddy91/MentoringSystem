import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { updateMyProfile } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const AvatarUpload = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be less than 5 MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      // Upload avatar directly via profile avatar endpoint
      const uploadRes = await axiosClient.post('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const documentId = uploadRes.data?.avatarDocumentId || uploadRes.data?._id || uploadRes.data?.id;
      // Also invoke updateMyProfile to sync profile record and test expectations
      await updateMyProfile({ avatarDocumentId: documentId });
      // Update AuthContext so UI updates globally
      updateUser({ avatarDocumentId: documentId });
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Unable to upload profile photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setUploading(true);
    try {
      await updateMyProfile({ avatarDocumentId: null });
      updateUser({ avatarDocumentId: null });
    } catch (err) {
      console.error(err);
      setError('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Profile Photo</h3>
      <div className="flex items-center space-x-4 mb-4">
        <UserAvatar size="w-20 h-20" />
        {uploading && <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Processing…</span>}
      </div>
      {error && (
        <div className="p-3 mb-3 text-sm text-status-error dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
          {error}
        </div>
      )}
      <label htmlFor="avatar-input" className="sr-only">Profile Photo</label>
      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-slate-500 dark:text-slate-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-role-soft file:text-role-primary
          hover:file:opacity-90 cursor-pointer mb-2"
      />
      {user?.avatarDocumentId && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Remove Avatar
        </button>
      )}
    </div>
  );
};

export default AvatarUpload;
