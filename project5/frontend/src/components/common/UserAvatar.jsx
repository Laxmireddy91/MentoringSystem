import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * UserAvatar – reusable component that renders the user's avatar image if set,
 * otherwise falls back to initials. It reads `user.avatarDocumentId` from AuthContext
 * and builds a download URL pointing to the document endpoint.
 *
 * Props:
 *   size: string – Tailwind width/height classes (e.g., 'w-9 h-9')
 *   className: string – additional classes
 */
export default function UserAvatar({ size = 'w-9 h-9', className = '' }) {
  const { user } = useAuth();
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (user?.avatarDocumentId) {
      // Assuming a route exists to serve the file preview/download
      setSrc(`/api/documents/${user.avatarDocumentId}/download`);
    } else {
      setSrc(null);
    }
  }, [user?.avatarDocumentId]);

  if (src) {
    return (
      <img
        src={src}
        alt="User avatar"
        className={`rounded-full object-cover ${size} ${className}`}
      />
    );
  }

  // Fallback – initials (first letter of name)
  const initials = user?.name?.[0]?.toUpperCase() || 'U';
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-role-primary text-white font-bold ${size} ${className}`}
    >
      {initials}
    </div>
  );
}
