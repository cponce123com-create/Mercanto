import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuthMe, useAuthLogout, type UserPublic } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthMeQueryKey } from "@workspace/api-client-react";

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
    }
  });

  const queryClient = useQueryClient();
  const logoutMutation = useAuthLogout({
    mutation: {
      onSuccess: () => {
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
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [district, setDistrictState] = useState<string>("San Ramón");

  useEffect(() => {
    const saved = localStorage.getItem("mercanto_district");
    if (saved) setDistrictState(saved);
  }, []);

  const setDistrict = (newDistrict: string) => {
    setDistrictState(newDistrict);
    localStorage.setItem("mercanto_district", newDistrict);
  };

  return (
    <DistrictContext.Provider value={{ district, setDistrict }}>
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
