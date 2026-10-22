"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

interface PermissionContextType {
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{module: string, action: string}>) => boolean;
  hasAllPermissions: (permissions: Array<{module: string, action: string}>) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          const permissions = authService.getUserPermissions();
          
          if (!permissions) {
            try {
              await authService.getProfile();
            } catch (error) {
              console.warn('Erro ao buscar perfil:', error);
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, []);

  const hasPermission = (module: string, action: string): boolean => {
    if (isLoading) return false;
    return authService.hasPermission(module, action);
  };

  const hasAnyPermission = (permissionsToCheck: Array<{module: string, action: string}>): boolean => {
    if (isLoading) return false;
    return authService.hasAnyPermission(permissionsToCheck);
  };

  const hasAllPermissions = (permissionsToCheck: Array<{module: string, action: string}>): boolean => {
    if (isLoading) return false;
    return authService.hasAllPermissions(permissionsToCheck);
  };

  return (
    <PermissionContext.Provider value={{ 
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions, 
      isLoading 
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  
  return context;
}