"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building,
  Users,
  Info,
  ChevronRight,
  Computer,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "../client-layout";
import { authService } from "@/services/auth.service";

export default function DashboardClient() {
  const { user } = useAuth();
  const router = useRouter();
  const orgHooks = useOrganizationHooks();
  const { data: owners, isLoading: isLoadingOwners } = orgHooks.getOwners();
  const { data: managers, isLoading: isLoadingManagers } =
    orgHooks.getManagers();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canViewOrganizations = mounted && authService.hasPermission("organizacao", "list");
  const canViewEquipment = mounted && authService.hasPermission("equipamento", "list");


  return (
    <ClientLayout title="Dashboard">
      <div className="space-y-8">
        <Card className="bg-gradient-to-r from-[#028eab] to-[#025e7b] text-white border-none shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

          <CardHeader className="relative">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Bem-vindo, {user?.username || "Utilizador"}!
                </CardTitle>
                <CardDescription className="text-white/80">
                  Aqui está um resumo do seu sistema de gestão
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-white/10 mr-3">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Proprietários</span>
                </div>
                <div className="mt-3 text-xl md:text-xl font-bold">
                  {isLoadingOwners ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded"></div>
                  ) : (
                    owners?.length || 0
                  )}
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-white/10 mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Gestores</span>
                </div>
                <div className="mt-3 text-xl md:text-xl font-bold">
                  {isLoadingManagers ? (
                    <div className="h-8 w-16 bg-white/10 animate-pulse rounded"></div>
                  ) : (
                    managers?.length || 0
                  )}
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-white/10 mr-3">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Status do Sistema</span>
                </div>
                <div className="mt-3 flex items-center">
                  <div className="text-xl md:text-xl font-bold">Ativo</div>
                  <div className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-[#028eab] mb-4">
          Acesso Rápido
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {canViewOrganizations && (
            <Card className="border border-gray-200 hover:border-[#028eab]/50 transition-all hover:shadow-md group">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#028eab]">
                  <Building className="h-5 w-5" />
                  Proprietários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione, edite e gerencie proprietários no sistema.
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {isLoadingOwners ? "..." : owners?.length || 0} registros
                  </div>
                  <Button
                    className="bg-white hover:bg-[#028eab]/10 text-[#028eab] border border-[#028eab]/30 hover:border-[#028eab] group-hover:bg-[#028eab]/10"
                    variant="outline"
                    onClick={() => router.push("/dashboard/proprietarios")}
                  >
                    Acessar <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canViewOrganizations && (
            <Card className="border border-gray-200 hover:border-[#028eab]/50 transition-all hover:shadow-md group">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#028eab]">
                  <Users className="h-5 w-5" />
                  Gestores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione, edite e gerencie gestores no sistema.
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {isLoadingManagers ? "..." : managers?.length || 0}{" "}
                    registros
                  </div>
                  <Button
                    className="bg-white hover:bg-[#028eab]/10 text-[#028eab] border border-[#028eab]/30 hover:border-[#028eab] group-hover:bg-[#028eab]/10"
                    variant="outline"
                    onClick={() => router.push("/dashboard/gestores")}
                  >
                    Acessar <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canViewEquipment && (
            <Card className="border border-gray-200 hover:border-[#028eab]/50 transition-all hover:shadow-md group">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-[#028eab]">
                  <Computer className="h-5 w-5" />
                  Equipamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione, edite e gerencie equipamentos no sistema.
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-[#028eab]/80">
                    Gestão completa
                  </div>
                  <Button
                    className="bg-white hover:bg-[#028eab]/10 text-[#028eab] border border-[#028eab]/30 hover:border-[#028eab] group-hover:bg-[#028eab]/10"
                    variant="outline"
                    onClick={() => router.push("/dashboard/equipamentos")}
                  >
                    Acessar <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
