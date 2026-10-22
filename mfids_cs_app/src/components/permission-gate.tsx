
"use client";

import { usePermission } from '@/contexts/permission-context';
import { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  module: string;
  action: string;
  fallback?: ReactNode;
}

export default function PermissionGate({ 
  children, 
  module, 
  action, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermission();
  
  if (isLoading) return null;
  
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface MultiPermissionGateProps {
  children: ReactNode;
  permissions: Array<{module: string, action: string}>;
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function MultiPermissionGate({ 
  children, 
  permissions, 
  requireAll = false, 
  fallback = null 
}: MultiPermissionGateProps) {
  const { hasAllPermissions, hasAnyPermission, isLoading } = usePermission();
  
  if (isLoading) return null;
  
  const check = requireAll 
    ? hasAllPermissions(permissions) 
    : hasAnyPermission(permissions);
    
  if (!check) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}