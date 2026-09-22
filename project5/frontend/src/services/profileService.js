import axiosClient from '../api/axiosClient';

/**
 * Fetch the authenticated user's profile.
 * GET /api/profile/me
 * axiosClient interceptor already unwraps response.data → response IS {success, data, message}
 */
export const getMyProfile = async () => {
  const response = await axiosClient.get('/profile/me');
  // response is the full API body { success, data, message }
  return response.data;
};

/**
 * Update the authenticated user's profile.
 * PATCH /api/profile/me
 * @param {Object} data - Partial profile fields to update.
 */
export const updateMyProfile = async (data) => {
  const response = await axiosClient.patch('/profile/me', data);
  // response is the full API body { success, data, message }
  return response.data;
};
