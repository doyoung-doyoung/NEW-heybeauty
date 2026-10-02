"use client";

import { createContext, useContext, useState } from "react";

export type LoginProvider = "line" | "google";

interface AuthContextValue {
  loggedIn: boolean;
  provider: LoginProvider | null;
  login: (provider: LoginProvider) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 로그인 상태를 헤더의 로그인 버튼과 홈 사이드바 카드가 같이 본다.
 * MVP라 실제 LINE/Google OAuth는 없고, 고른 쪽으로 "로그인된 척"만 한다.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<LoginProvider | null>(null);

  return (
    <AuthContext.Provider
      value={{
        loggedIn: provider !== null,
        provider,
        login: setProvider,
        logout: () => setProvider(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
