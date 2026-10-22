"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building,
  Pencil,
  Eye,
  Search,
  Users,
  Info,
  User,
  FileBarChart,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";
import { Card, CardContent } from "@/components/ui/card";
import { AddGestorButton } from "@/components/dashboard/organizations/add-gestor-button";
import PermissionGate from "@/components/permission-gate";
import { useAuth } from "@/contexts/auth-context";

function GestoresPage() {
  const router = useRouter();
  const { hasUserType } = useAuth();
  const { getManagers } = useOrganizationHooks();
  const { data: managers, isLoading } = getManagers();
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerNames] = useState<Record<number, string>>({});

  const filteredManagers = React.useMemo(() => {
    return managers?.filter(
      (manager) =>
        manager?.nome?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        manager?.nif?.includes(searchTerm) ||
        manager?.natureza_juridica
          ?.toLowerCase()
          ?.includes(searchTerm.toLowerCase()) ||
        (ownerNames[manager.parent_id as number] || "")
          .toLowerCase()
          ?.includes(searchTerm.toLowerCase())
    );
  }, [managers, searchTerm, ownerNames]);

  return (
    <TooltipProvider>
      <ClientLayout title="Gestores">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-xl md:text-xl font-bold">
                    Gestores
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Gerencie todos os gestores registrados no sistema
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AddGestorButton />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver lista de proprietários</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Buscar por nome, NIF ou natureza jurídica..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-5 border-gray-300 bg-gray-50 focus:border-[#028eab] focus:ring focus:ring-[#028eab] focus:ring-opacity-20 w-full"
                />
              </div>

              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  size="sm"
                  className="w-full sm:w-auto border-gray-300"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Total de Gestores
                  </p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">
                    {managers?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            {hasUserType("P") || hasUserType("G") && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-green-500">
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">
                        Dica
                      </p>
                      <p className="text-xs sm:text-sm">
                        Para adicionar novos gestores, navegue até a página de
                        proprietários
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/proprietarios")}
                    className="hidden sm:flex border-gray-300"
                  >
                    <Building className="mr-2 h-4 w-4" /> Proprietários
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingData />
            </div>
          ) : filteredManagers && filteredManagers.length > 0 ? (
            <>
              <div className="md:hidden space-y-4">
                {filteredManagers.map((manager) => (
                  <Card
                    key={manager.id}
                    className="bg-white border shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 border-b">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                          style={{ backgroundColor: "#028eab" }}
                        >
                          {manager.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {manager.nome}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ID: {manager.id}
                          </p>
                        </div>
                      </div>

                      {/* Conteúdo do Card */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              NIF:
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="px-2 py-1 text-xs font-medium"
                          >
                            {manager.nif}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileBarChart className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              Natureza:
                            </span>
                          </div>
                          <Badge
                            className="text-xs font-semibold px-2 py-1"
                            style={{
                              backgroundColor: "#028eab",
                              color: "white",
                            }}
                          >
                            {manager.natureza_juridica}
                          </Badge>
                        </div>

                        {typeof manager.parent_id === "number" && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm font-medium text-gray-700">
                                Proprietário:
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/proprietarios/${manager.parent_id}`
                                )
                              }
                              className="p-0 h-auto font-medium hover:bg-transparent"
                              style={{ color: "#028eab" }}
                            >
                              <Building className="mr-1 h-3 w-3" />
                              Ver Proprietário
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Rodapé com Ações */}
                      <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-700"
                          onClick={() =>
                            router.push(`/dashboard/gestores/${manager.id}`)
                          }
                        >
                          <Eye className="mr-1 h-4 w-4" /> Ver Detalhes
                        </Button>
                        <PermissionGate module="organizacao" action="update">
                          {!hasUserType("P") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: "#028eab" }}
                              onClick={() =>
                                router.push(
                                  `/dashboard/gestores/editar/${manager.id}`
                                )
                              }
                            >
                              <Pencil className="mr-1 h-4 w-4" /> Editar
                            </Button>
                          )}
                        </PermissionGate>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tabela para Desktop */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm border">
                <div
                  className="w-full overflow-x-auto"
                  style={{ minWidth: "100%", overflowX: "auto" }}
                >
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">
                          Nome
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">
                          NIF
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                          Natureza Jurídica
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                          Proprietário
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredManagers.map((manager) => (
                        <TableRow
                          key={manager.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: "#028eab" }}
                              >
                                {manager.nome.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[200px]">
                                {manager.nome}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="px-2 py-1 text-xs font-medium"
                            >
                              {manager.nif}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p
                              className="text-xs font-semibold px-2 py-1"
                              style={{
                                backgroundColor: "#fff",
                                color: "#028eab",
                              }}
                            >
                              {manager.natureza_juridica ===
                              "Outro (ESPECIFIQUE)"
                                ? manager?.natureza_juridica_outro ?? "N/A"
                                : manager.natureza_juridica ?? "N/A"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {typeof manager.parent_id === "number" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/proprietarios/${manager.parent_id}`
                                      )
                                    }
                                    className="p-0 h-auto font-medium hover:bg-transparent"
                                    style={{ color: "#028eab" }}
                                  >
                                    <Building className="mr-1 h-3 w-3" />
                                    Ver Proprietário
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes do proprietário</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full p-2 h-auto"
                                    style={{ color: "#028eab" }}
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/gestores/${manager.id}`
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>

                              <PermissionGate
                                module="organizacao"
                                action="update"
                              >
                                {!hasUserType("P") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full p-2 h-auto"
                                        style={{ color: "#028eab" }}
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/gestores/editar/${manager.id}`
                                          )
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar gestor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border py-10 sm:py-16">
              <div className="text-center">
                {searchTerm ? (
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-3">
                      Nenhum gestor encontrado para &quot;{searchTerm}&quot;
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setSearchTerm("")}
                    >
                      Limpar Pesquisa
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-4">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-2">
                      Nenhum gestor encontrado
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-md text-center mb-6">
                      Para adicionar um gestor, primeiro selecione um
                      proprietário. Cada gestor deve estar associado a um
                      proprietário no sistema.
                    </p>
                    <Button
                      style={{ backgroundColor: "#028eab" }}
                      onClick={() => router.push("/dashboard/proprietarios")}
                      className="w-full sm:w-auto max-w-[250px]"
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Ver Proprietários
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: "organizacao",
  action: "list",
})(GestoresPage);
