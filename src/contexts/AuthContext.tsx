import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { authAPI, type User } from "../services/api";

interface AuthContextType {
  user: User | null;
  setUser?: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const USER_CACHE_KEY = "cached_user_data";
const USER_CACHE_TIMESTAMP_KEY = "cached_user_timestamp";
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  // Initialize user from localStorage on component mount
  React.useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem("access_token");
      const tokenType = localStorage.getItem("token_type");

      if (token && tokenType) {
        try {
          // Try to get user from cache first
          const cachedUser = localStorage.getItem(USER_CACHE_KEY);
          const cachedTimestamp = localStorage.getItem(
            USER_CACHE_TIMESTAMP_KEY
          );

          if (cachedUser && cachedTimestamp) {
            const age = Date.now() - parseInt(cachedTimestamp, 10);

            // Use cached data if it's fresh (less than TTL)
            if (age < USER_CACHE_TTL) {
              setUser(JSON.parse(cachedUser));

              // Silently refresh user data in background
              authAPI
                .getMe()
                .then((userData) => {
                  setUser(userData);
                  localStorage.setItem(
                    USER_CACHE_KEY,
                    JSON.stringify(userData)
                  );
                  localStorage.setItem(
                    USER_CACHE_TIMESTAMP_KEY,
                    Date.now().toString()
                  );
                })
                .catch((err) =>
                  console.error("Background user refresh failed:", err)
                );

              return; // Use cached data for now
            }
          }

          // No cache or expired - fetch fresh data
          const userData = await authAPI.getMe();
          setUser(userData);

          // Cache the user data
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
          localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
          console.error("Failed to restore user session:", error);
          // Clear invalid tokens and cache
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem(USER_CACHE_KEY);
          localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
        }
      }
    };

    initializeUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        // Authenticate and get the token
        const { access_token, token_type } = await authAPI.login(
          email,
          password
        );

        // Store tokens
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_type", token_type);

        // Use the token to fetch user details
        const userData = await authAPI.getMe();

        // Update the user state with the fetched details
        setUser(userData);

        // Cache user data
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());

        return true;
      } catch (error: any) {
        console.error("Login failed:", error);

        // Re-throw error with proper details for the UI to handle
        if (
          error.message.includes("Please verify your email address") ||
          error.message.includes("403")
        ) {
          throw new Error("EMAIL_NOT_VERIFIED");
        } else if (
          error.message.includes("Incorrect email or password") ||
          error.message.includes("401")
        ) {
          throw new Error("INVALID_CREDENTIALS");
        } else {
          throw new Error("LOGIN_ERROR");
        }
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      try {
        // Send registration details to the backend
        await authAPI.register({ name, email, password });

        // Do NOT automatically log in the user after registration
        // User must verify their email first before they can log in

        return true;
      } catch (error) {
        console.error("Registration failed:", error);
        return false;
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");

    if (token && tokenType) {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);

        // Update cache
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        // Don't clear tokens on refresh failure, user might just be offline
      }
    }
  }, []);

  // Memoize computed values and context value
  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      login,
      register,
      logout,
      refreshUser,
      isAdmin,
    }),
    [user, login, register, logout, refreshUser, isAdmin]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
