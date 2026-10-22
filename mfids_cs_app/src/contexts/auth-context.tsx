"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import { LoginCredentials, User } from "@/types/type";

interface AuthContextType {
  user: User | null;
  userType: string | null; 
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasUserType: (type: string) => boolean;
  idOrganizacao: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [idOrganizacao, setIdOrganizacao] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser?.data as any);
            const type = currentUser?.user_type?.tipo_organizacao || null;
            const id = currentUser?.user_type?.id_organizacao || null;
            setIdOrganizacao(id);
            setUserType(type);
          } else {
            try {
              const profile = await authService.getProfile();
              setUser(profile);
              localStorage.setItem('user', JSON.stringify(profile));
              const type = profile.user_type?.tipo_organizacao || null;
              const id = profile.user_type?.id_organizacao || null;
              setIdOrganizacao(id);
              setUserType(type);
            } catch (error) {
              console.error("Erro ao buscar perfil:", error);
              //await logout();
            }
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname === "/login";
      
      if (!user && !isAuthPage) {
        router.push("/login");
      } else if (user && isAuthPage) {
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response: any = await authService.login(credentials);
      setUser(response?.user?.data as any);
      const type = response?.user?.user_type?.tipo_organizacao || null;
      setUserType(type);
      const id = response?.user?.user_type?.id_organizacao || null;
      setIdOrganizacao(id);
      
      router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setUserType(null);
      setIdOrganizacao(null);
      router.push("/login");
    } catch {
      toast.error("Erro ao fazer logout.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasUserType = (type: string): boolean => {
    return userType === type;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      isLoading, 
      login, 
      logout, 
      hasUserType,
      idOrganizacao
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}