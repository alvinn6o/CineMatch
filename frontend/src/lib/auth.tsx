"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "./api";
import { AuthResponse, User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      api
        .get("/api/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post<AuthResponse>("/api/auth/login", {
      username,
      password,
    });
    const { access_token, username: uname, user_id } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("username", uname);
    setToken(access_token);
    setUser({ id: user_id, username: uname, email: "" });
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post<AuthResponse>("/api/auth/register", {
      username,
      email,
      password,
    });
    const { access_token, username: uname, user_id } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("username", uname);
    setToken(access_token);
    setUser({ id: user_id, username: uname, email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
