"use client";

import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building, 
  Users,
  LayoutDashboard, 
  LogOut, 
  User,
  Menu,
  ChevronLeft,
  Computer,
  User2Icon,
  Map,
 // Map
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import imageLog from '../../public/logo-site.png';
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { useMediaQuery } from "@/hooks/system/use-media";
interface ClientLayoutProps {
  children: ReactNode;
  title: string;
  className?: string;
}

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  permission?: {
    module: string;
    action: string;
  };
}


export function ClientLayout({ children, title, className }: ClientLayoutProps) {
  const { isMobile } = useMediaQuery();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasUserType, idOrganizacao } = useAuth();

  const isActive = (path: string) => {
  if (path === "/dashboard") {
    return pathname === "/" || 
           pathname === "/dashboard" || 
           (pathname === "/dashboard/" && pathname.length <= 11);
  }
  return pathname.startsWith(path);
};

  const handleLogout = async () => {
    await logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

   const getOrganizationPath = () => {
    if (hasUserType("P")) {
      return `/dashboard/proprietarios/${idOrganizacao}`;
    } else if (hasUserType("G")) {
      return `/dashboard/gestores/${idOrganizacao}`;
    }
    return "/dashboard/proprietarios";
  };


  const navItems: NavItem[] = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    ...(hasUserType("P") || hasUserType("G") ? [{
      path: getOrganizationPath(),
      name: {
        P: "Entidade Proprietária",
        G: "Entidade Gestora",
      }[hasUserType("P") ? "P" : "G"],
      icon: <Building className="h-5 w-5" />,
      permission: { module: "organizacao", action: "list" }
      
    }] : [
      {
        path: "/dashboard/proprietarios",
        name: "Proprietários",
        icon: <Users className="h-5 w-5" />,
        permission: { module: "organizacao", action: "list" }
      },
      {
        path: "/dashboard/gestores",
        name: "Gestores",
        icon: <Users className="h-5 w-5" />,
        permission: { module: "organizacao", action: "list" }
      }
    ]),
    ...(hasUserType("P") ? [{
      path: "/dashboard/gestores",
      name: "Gestores",
      icon: <Users className="h-5 w-5" />,
      permission: { module: "organizacao", action: "list" }
    }] : []),
    ...(hasUserType("G") ? [{
      path: "/dashboard/proprietarios",
      name: "Proprietários",
      icon: <Users className="h-5 w-5" />,
      permission: { module: "organizacao", action: "list" }
    }] : []),
    {
      path: "/dashboard/equipamentos",
      name: "Equipamentos",
      icon: <Computer className="h-5 w-5" />,
      permission: { module: "equipamento", action: "list" }
    },
    {
      path: "/dashboard/mapa",
      name: "Mapa",
      icon: <Map className="h-5 w-5" />,
      permission: { module: "equipamento", action: "list" }
    },
    {
      path: "/dashboard/perfil",
      name: "Perfil",
      icon: <User2Icon className="h-5 w-5" />
    }
  ];

  const filteredNavItems = mounted ? navItems.filter(item => {
    if (!item.permission) return true;
    return authService.hasPermission(item.permission.module, item.permission.action);
  }) : [];

  return (
    <TooltipProvider>
      <div className="flex min-h-screen z-50 bg-gray-50">
        <aside 
          className={cn(
            "bg-white shadow-lg transition-all duration-300 ease-in-out fixed h-full z-10",
            isSidebarOpen ? "w-64" : "w-20",
            mounted && isMobile && !isSidebarOpen && "hidden"
          )}
        >
          <div className="flex flex-col h-full">
            <div className={cn(
              "p-4 flex items-center border-b border-gray-100",
              isSidebarOpen ? "justify-between" : "justify-center"
            )}>
              {isSidebarOpen && (
                <div className="flex-shrink-0">
                  <Image src={imageLog} alt="Logo" width={200} height={200} style={{ width: "200px", height: "auto" }} className="object-contain" priority />
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSidebar} 
                    className="text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    {isSidebarOpen ? <ChevronLeft /> : <Menu />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isSidebarOpen ? 'Recolher menu' : 'Expandir menu'}
                </TooltipContent>
              </Tooltip>
            </div>

            <nav className="p-4 flex-1 overflow-y-auto">
              <ul className="space-y-2">
                {filteredNavItems.map((item) => (
                  <li key={item.path}>
                    {!isSidebarOpen ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link 
                            href={item.path} 
                            className={cn(
                              "flex items-center rounded-lg p-3 text-gray-600 transition-all hover:bg-blue-50 hover:text-[#028eab]",
                              isActive(item.path) && " text-[#028eab] font-medium shadow-sm",
                              "justify-center"
                            )}
                          >
                            <span className={cn(
                              "flex items-center justify-center",
                              isActive(item.path) && "text-[#028eab]"
                            )}>
                              {item.icon}
                            </span>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link 
                        href={item.path} 
                        className={cn(
                          "flex items-center rounded-lg p-3 text-gray-600 transition-all hover:bg-blue-50 hover:text-[#028eab]",
                          isActive(item.path) && "bg-blue-50 text-[#028eab] font-medium shadow-sm"
                        )}
                      >
                        <span className={cn(
                          "flex items-center justify-center",
                          isActive(item.path) && "text-[#028eab]"
                        )}>
                          {item.icon}
                        </span>
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {user && isSidebarOpen && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center space-x-3 text-sm">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-50">
                    <AvatarFallback className="bg-[#028eab] text-white">
                      {user?.username && user?.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 truncate">{user?.username}</p>
                    {/* <p className="text-gray-500 text-xs truncate">Agente</p> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            isSidebarOpen ? "md:ml-64" : "md:ml-20",
            mounted && !isMobile && "ml-0",
            mounted && isMobile && isSidebarOpen && "ml-0"
          )}
        >
          <header className="bg-white p-4 border-b border-gray-100 shadow-sm flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center">
              {mounted && isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleSidebar} 
                      className="mr-4 text-gray-500 hover:bg-gray-100 rounded-full"
                    >
                      <Menu />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir menu</TooltipContent>
                </Tooltip>
              )}
              <h1 className="text-sm md:text-xl font-bold text-gray-800">{title}</h1>
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="!z-[9999]" asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarFallback className="bg-[#028eab] text-white">
                        {user?.username && user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-700">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="!z-[9999] w-56">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">{user.username}</p>
                    {/* <p className="text-xs text-gray-500">Agente</p> */}
                  </div>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/perfil")} className="py-2 cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="py-2 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          
          <main className="flex-1 p-2 md:p-6 overflow-auto">
            <div className={`${className} max-w-7xl mx-auto`}>
              {children}
            </div>
          </main>

          <footer className="bg-white p-4 border-t border-gray-100 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Sistema de Gestão. Todos os direitos reservados.
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}