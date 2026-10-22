"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/contexts/permission-context';

type WithPermissionProps = {
  module: string;
  action: string;
  redirectTo?: string;
};

export function withPermission<T extends object>({ 
  module, 
  action, 
  redirectTo = '/dashboard' 
}: WithPermissionProps) {
  return (Component: React.ComponentType<T>) => {
    function ProtectedComponent(props: T) {
      const { hasPermission, isLoading } = usePermission();
      const router = useRouter();
      const [hasAccess, setHasAccess] = useState<boolean | null>(null);
      
      useEffect(() => {
        if (!isLoading) {
          try {
            const allowed = hasPermission(module, action);
            
            if (!allowed) {
              router.replace(redirectTo);
              setHasAccess(false);
            } else {
              setHasAccess(true);
            }
            
          } catch (error) {
            console.error("Error checking permission:", error);
            router.replace(redirectTo);
            setHasAccess(false);
          }
        }
      }, [isLoading, hasPermission, module, action, router, redirectTo]);
      
      if (isLoading || hasAccess === null) {
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" 
                 style={{ borderColor: "#028eab transparent #f3f4f6 #f3f4f6" }}></div>
            <p className="mt-4 text-lg font-medium text-gray-600">Verificando permissões...</p>
          </div>
        );
      }
      
      if (hasAccess === false) {
        return null;
      }
      
      return <Component {...props} />;
    }
    
    ProtectedComponent.displayName = `withPermission(${Component.displayName || Component.name || 'Component'})`;
    
    return ProtectedComponent;
  };
}