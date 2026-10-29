import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = {
  '/dashboard/equipamentos': { module: 'equipamento', action: 'list' },
  '/dashboard/equipamentos/criar': { module: 'equipamento', action: 'create' },
  '/dashboard/equipamentos/editar': { module: 'equipamento', action: 'update' },
  '/dashboard/proprietarios': { module: 'organizacao', action: 'list' },
  '/dashboard/proprietarios/criar': { module: 'organizacao', action: 'create' },
  '/dashboard/proprietarios/editar': { module: 'organizacao', action: 'update' },
  '/dashboard/gestores': { module: 'organizacao', action: 'list' },
  '/dashboard/gestores/criar': { module: 'organizacao', action: 'create' },
  '/dashboard/gestores/editar': { module: 'organizacao', action: 'update' },
  '/dashboard/mapa': { module: 'equipamento', action: 'list' },
  '/dashboard/perfil': { module: 'equipamento', action: 'list' },
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('mfids_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const permissionsStr = request.cookies.get('user_permissions')?.value;
  
  if (!permissionsStr) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const path = request.nextUrl.pathname;
  
  const matchedRoute = Object.keys(protectedRoutes).find(route => 
    path === route || path.startsWith(`${route}/`));
  
  if (matchedRoute) {
    try {
      const permissions = JSON.parse(permissionsStr);
      const { module, action } = protectedRoutes[matchedRoute as keyof typeof protectedRoutes];
      
      const modulePermissions = permissions[module];
      const hasPermission = modulePermissions?.actions?.includes(action);
      
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};