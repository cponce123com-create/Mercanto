import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useAuthMe, useAuthLogout, type UserPublic, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthMeQueryKey } from "@workspace/api-client-react";
import { DISTRICTS } from "@/lib/constants";

const TOKEN_KEY = "mercanto_jwt";
const DISTRICT_KEY = "mercanto_district";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

setAuthTokenGetter(() => getStoredToken());

interface AuthContextType {
  user: UserPublic | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useAuthMe({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    } as any
  });

  const queryClient = useQueryClient();
  const logoutMutation = useAuthLogout({
    mutation: {
      onSuccess: () => {
        clearStoredToken();
        queryClient.setQueryData(getAuthMeQueryKey(), null);
      },
      onError: () => {
        clearStoredToken();
        queryClient.setQueryData(getAuthMeQueryKey(), null);
      }
    }
  });

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      logout: () => logoutMutation.mutate(),
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface DistrictContextType {
  district: string;
  setDistrict: (district: string) => void;
  detecting: boolean;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [district, setDistrictState] = useState<string>("");
  const [detecting, setDetecting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const didInit = useRef(false);

  const setDistrict = (newDistrict: string) => {
    setDistrictState(newDistrict);
    setShowPicker(false);
    localStorage.setItem(DISTRICT_KEY, newDistrict);

    if (user) {
      fetch(`${import.meta.env.BASE_URL}api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ district: newDistrict }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (didInit.current) return;
    didInit.current = true;

    if (user?.district) {
      setDistrictState(user.district);
      localStorage.setItem(DISTRICT_KEY, user.district);
      return;
    }

    const saved = localStorage.getItem(DISTRICT_KEY);
    if (saved) {
      setDistrictState(saved);
      return;
    }

    if (!navigator.geolocation) {
      setShowPicker(true);
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const base = import.meta.env.BASE_URL;
          const res = await fetch(
            `${base}api/stores?lat=${latitude}&lng=${longitude}&radiusKm=15&limit=1`
          );
          if (res.ok) {
            const data = await res.json();
            const first = data?.stores?.[0];
            if (first?.district && DISTRICTS.includes(first.district)) {
              setDistrictState(first.district);
              localStorage.setItem(DISTRICT_KEY, first.district);
              setDetecting(false);
              return;
            }
          }
        } catch (_) {}
        setDetecting(false);
        setShowPicker(true);
      },
      () => {
        setDetecting(false);
        setShowPicker(true);
      },
      { timeout: 8000 }
    );
  }, [authLoading, user]);

  return (
    <DistrictContext.Provider value={{ district, setDistrict, detecting, showPicker, setShowPicker }}>
      {children}
    </DistrictContext.Provider>
  );
}

export function useDistrict() {
  const context = useContext(DistrictContext);
  if (context === undefined) {
    throw new Error("useDistrict must be used within a DistrictProvider");
  }
  return context;
}
