"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Eye,
  Users, 
  Search,
  Building,
  FileText,
  User,
  FileBarChart
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
import { Input } from "@/components/ui/input";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import Link from "next/link";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";
import { Card, CardContent } from "@/components/ui/card";
import PermissionGate from "@/components/permission-gate";
import { useAuth } from "@/contexts/auth-context";

function ProprietariosPage() {
  const router = useRouter();
   const {  hasUserType } = useAuth();
  const { getOwners } = useOrganizationHooks();
  const { data: owners, isLoading } = getOwners();
  const [searchTerm, setSearchTerm] = useState("");

  const totalOwners = owners?.length || 0;
  const totalManagers = useMemo(() => {
    return owners?.reduce((total, owner) => total + (owner.gestor_count || 0), 0) || 0;
  }, [owners]);

  const filteredOwners = useMemo(() => {
    return owners?.filter(owner => 
      owner.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.nif.includes(searchTerm) ||
      owner.natureza_juridica.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [owners, searchTerm]);

  return (
    <TooltipProvider>
      <ClientLayout title="Proprietários">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Card */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-xl md:text-xl font-bold">Proprietários</h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Gerencie os proprietários registrados no sistema
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <PermissionGate module="organizacao" action="create">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/dashboard/proprietarios/criar" className="w-full sm:w-auto">
                      <Button 
                        style={{ backgroundColor: "#028eab", color: "white" }} 
                        className="hover:bg-opacity-90 w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Novo Proprietário
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adicionar um novo proprietário</p>
                  </TooltipContent>
                </Tooltip>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Search Bar */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total de Proprietários</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{totalOwners}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-amber-500"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Gestores Associados</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{totalManagers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-green-500"
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Dica</p>
                    <p className="text-xs sm:text-sm">Adicione gestores a um proprietário para representá-lo</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push("/dashboard/gestores")}
                      className="hidden sm:flex border-gray-300"
                    >
                      <Users className="mr-2 h-4 w-4" /> Gestores
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver todos os gestores</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Tabela para desktop e cards para mobile */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingData />
            </div>
          ) : filteredOwners && filteredOwners.length > 0 ? (
            <>
              {/* Cards para Mobile */}
              <div className="md:hidden space-y-4">
                {filteredOwners.map(owner => (
                  <Card key={owner.id} className="bg-white border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center p-4 border-b">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                          style={{ backgroundColor: "#028eab" }}
                        >
                          {owner.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{owner.nome}</h3>
                          <p className="text-sm text-gray-500">ID: {owner.id}</p>
                        </div>
                      </div>
                      
                      {/* Conteúdo do Card */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">NIF:</span>
                          </div>
                          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
                            {owner.nif}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileBarChart className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Natureza:</span>
                          </div>
                          <Badge 
                            className="text-xs font-semibold px-2 py-1" 
                            style={{ backgroundColor: "#028eab", color: "white" }}
                          >
                            {owner.natureza_juridica}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Gestores:</span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="secondary" className="text-xs">
                              {owner.gestor_count || 0} gestor(es)
                            </Badge>
                            {owner.gestor && owner.gestor.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/gestores/${owner.id}`)}
                                className="ml-1 rounded-full p-1 h-auto"
                                style={{ color: "#028eab" }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rodapé com Ações */}
                      <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-700"
                          onClick={() => router.push(`/dashboard/proprietarios/${owner.id}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> Detalhes
                        </Button>
                        
                        <div className="flex gap-2">
                          <PermissionGate module="organizacao" action="update">
                            {hasUserType("G") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: "#028eab" }}
                            onClick={() => router.push(`/dashboard/proprietarios/editar/${owner.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                          </PermissionGate>
                          <PermissionGate module="organizacao" action="create">
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: "#028eab" }}
                            onClick={() => router.push(`/dashboard/gestores/criar/${owner.id}`)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Tabela para Desktop */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm border">
                <div className="w-full overflow-x-auto" style={{ minWidth: "100%", overflowX: "auto" }}>
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nome</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">NIF</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Natureza Jurídica</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[130px]">Gestores</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOwners.map((owner) => (
                        <TableRow 
                          key={owner.id} 
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold cursor-help flex-shrink-0"
                                    style={{ backgroundColor: "#028eab" }}
                                  >
                                    {owner.nome.charAt(0).toUpperCase()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>ID: {owner.id}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="truncate max-w-[200px]">{owner.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="px-2 py-1 text-xs font-medium">{owner.nif}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p 
                              className="text-xs font-semibold px-2 py-1" 
                              style={{ backgroundColor: "#fff", color: "#028eab" }}
                            >
                              {owner.natureza_juridica === "Outro (ESPECIFIQUE)" ? owner.natureza_juridica_outro : owner.natureza_juridica}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <Badge variant="secondary" className="text-xs">
                                {owner.gestor_count || 0} gestor(es)
                              </Badge>
                              
                              {owner.gestor && owner.gestor.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        router.push(`/dashboard/gestores/${owner.id}`)
                                      }
                                      className="ml-2 rounded-full p-1 h-auto"
                                      style={{ color: "#028eab" }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver gestores associados</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
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
                                    onClick={() => router.push(`/dashboard/proprietarios/${owner.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <PermissionGate module="organizacao" action="update">
                                {!hasUserType("G") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full p-2 h-auto"
                                    style={{ color: "#028eab" }}
                                    onClick={() => router.push(`/dashboard/proprietarios/editar/${owner.id}`)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar proprietário</p>
                                </TooltipContent>
                              </Tooltip>
                                )}
                              </PermissionGate>

                              <PermissionGate module="organizacao" action="create">
                                {(!hasUserType("P") || !hasUserType("G")) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full p-2 h-auto"
                                    style={{ color: "#028eab" }}
                                    onClick={() => router.push(`/dashboard/gestores/criar/${owner.id}`)}
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adicionar gestor</p>
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
                      Nenhum proprietário encontrado para &quot;{searchTerm}&quot;
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
                    <Building className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-3">
                      Nenhum proprietário encontrado
                    </p>
                    
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
  module: 'organizacao',
  action: 'list'
})(ProprietariosPage);