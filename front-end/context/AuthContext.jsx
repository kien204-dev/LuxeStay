import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("user");
      }
    }

    return null;
  });

  const login = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    fetch(`${apiBaseUrl}/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((userData) => {
    setUser((currentUser) => {
      const nextUser = {
        ...(currentUser || {}),
        ...userData,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateCurrentUser, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
