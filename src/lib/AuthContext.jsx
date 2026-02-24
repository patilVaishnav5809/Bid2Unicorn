import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";

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

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Update team activity fields on the teams table.
 * Fields: is_online, last_login_at, last_active_at, status
 */
async function updateTeamActivity(email, fields) {
  if (!email) return;
  try {
    const { error } = await supabase
      .from('teams')
      .update(fields)
      .eq('leader_email', email);
    if (error) console.warn("[AuthContext] Team activity update failed:", error.message);
  } catch (err) {
    console.warn("[AuthContext] Error updating team activity:", err);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  // ── Mark team offline on tab close / browser close ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.email && user?.role !== 'admin') {
        // sendBeacon is more reliable during page unload than fetch
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/teams?leader_email=eq.${encodeURIComponent(user.email)}`;
        const headers = {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        };
        const body = JSON.stringify({ 
          is_online: false, 
          status: 'inactive',
          last_active_at: new Date().toISOString() 
        });
        // sendBeacon doesn't support custom headers, so fall back to fetch with keepalive
        try {
          fetch(url, { method: 'PATCH', headers, body, keepalive: true });
        } catch {
          // best-effort
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // ── Heartbeat: update last_active_at every 30s while tab is active ──
  useEffect(() => {
    if (!user?.email || user?.role === 'admin') return;
    
    const runHeartbeat = () => {
      updateTeamActivity(user.email, {
        is_online: true,
        last_active_at: new Date().toISOString(),
        status: 'active'
      });
    };

    // Mark online immediately
    runHeartbeat();

    const heartbeat = setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(heartbeat);
  }, [user]);

  // ── Restore session on mount ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check for Mock User (Dev Bypass Persistence)
        const mockUser = localStorage.getItem('base44_mock_user');
        if (mockUser) {
            console.log("[AuthContext] Restoring Mock Session");
            const parsed = JSON.parse(mockUser);
            setUser(parsed);
            // Mark team online on session restore
            if (parsed.role !== 'admin') {
              updateTeamActivity(parsed.email, {
                is_online: true,
                last_active_at: new Date().toISOString(),
                status: 'active'
              });
            }
            setIsLoadingAuth(false);
            return;
        }

        // 2. Check Real Supabase Session
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Mark team online on session restore
        if (currentUser?.email && currentUser?.role !== 'admin') {
          updateTeamActivity(currentUser.email, {
            is_online: true,
            last_active_at: new Date().toISOString(),
            status: 'active'
          });
        }
      } catch (error) {
        setUser(null);
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

  // ── Login ──
  const login = useCallback(async (userData) => {
    let email = userData.email;

    if (!email) {
        throw new Error("Please enter an Email address.");
    }
    
    // We expect the user to type the direct admin/team email in the Login.jsx form natively now.
    const user = await base44.auth.login(email, userData.role, userData.password);
    setUser(user);
    // Mark team online + record login timestamp
    if (user?.role !== 'admin' && (user?.email || email)) {
      const now = new Date().toISOString();
      await updateTeamActivity(user?.email || email, {
        is_online: true,
        last_login_at: now,
        last_active_at: now,
        status: 'active'
      });
    }
    return user;
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    // Mark team offline BEFORE clearing session
    if (user?.email && user?.role !== 'admin') {
      await updateTeamActivity(user.email, {
        is_online: false,
        last_active_at: new Date().toISOString(),
        status: 'inactive'
      });
    }
    localStorage.removeItem('base44_mock_user');
    await base44.auth.logout();
    setUser(null);
    // Redirect to home page
    window.location.href = "/";
  }, [user]);

  const navigateToLogin = useCallback(() => {
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
