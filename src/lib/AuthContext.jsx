import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  role: "guest", // guest, user, admin
  isLoadingAuth: true,
  isLoadingPublicSettings: false, 
  authError: null,
  login: (userData) => {},
  logout: () => {},
  navigateToLogin: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
        // If error is "Not authenticated", it just means no user is logged in.
        // We shouldn't treat this as an application error.
        if (error.message === 'Not authenticated' || error.message === 'No current user') {
          setAuthError(null); 
        } else {
          setAuthError(error);
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (userData) => {
    // userData here is { name, role } from Home.jsx
    // We map name to an email for consistency with mock data
    const email = `${userData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const user= await base44.auth.login(email, userData.role);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await base44.auth.logout();
    setUser(null);
  }, []);

  const navigateToLogin = useCallback(() => {
      // In a real app this might use useNavigate, but window.location is safer here 
      // to avoid router context issues if AuthProvider is outside Router
      window.location.href = "/";
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    role: user?.role || "guest",
    authError,
    isLoadingPublicSettings,
    isLoadingAuth,
    login,
    logout,
    navigateToLogin
  }), [user, isLoadingAuth, authError, isLoadingPublicSettings, login, logout, navigateToLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
