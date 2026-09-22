import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyRoleTheme } from '../../utils/roleThemes';

/**
 * RoleThemeProvider – pre‑auth pages (Login, Activate)
 *
 * It reads the optional `role` query param (e.g. /login?role=mentor)
 * and applies the role's CSS custom properties. This ensures the page
 * shows the correct accent before the user is authenticated.
 *
 * If no param is present, we keep the default (institutional navy)
 * which matches the existing landing page design.
 */
export default function RoleThemeProvider({ children }) {
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const role = params.get('role');
    if (role) {
      applyRoleTheme(role);
    }
  }, [search]);

  return children;
}
