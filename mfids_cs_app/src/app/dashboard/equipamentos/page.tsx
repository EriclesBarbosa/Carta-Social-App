"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Pencil, 
  Eye,
  Search,
  Building,
  FileText,
  MapPin,
  Calendar,
  User,
  Phone
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
import { ClientLayout } from "@/components/client-layout";
import Link from "next/link";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import LoadingData from "@/components/loading";
import PermissionGate from "@/components/permission-gate";
import { withPermission } from "@/components/permission/withPermission";
import { Card, CardContent } from "@/components/ui/card";

function EquipamentosPage() {
  const router = useRouter();
  const { getEquipments } = useEquipmentHooks();
  const { data: equipments, isLoading } = getEquipments();
  const [searchTerm, setSearchTerm] = useState("");
  
  const totalEquipments = equipments?.length || 0;

  const filteredEquipments = useMemo(() => {
    return equipments?.filter(equipment => 
      equipment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [equipments, searchTerm]);


  console.log("filteredEquipments", filteredEquipments);

  return (
    <TooltipProvider>
      <ClientLayout title="Equipamentos">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-xl md:text-xl font-bold">Equipamentos</h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Gerencie os equipamentos e respostas sociais do sistema
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <PermissionGate module="equipamento" action="create">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/dashboard/equipamentos/criar" className="w-full sm:w-auto">
                        <Button 
                          style={{ backgroundColor: "#028eab", color: "white" }} 
                          className="hover:bg-opacity-90 w-full sm:w-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar um novo equipamento</p>
                    </TooltipContent>
                  </Tooltip>
                </PermissionGate>
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
                  placeholder="Buscar por nome, código..."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total de Equipamentos</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{totalEquipments}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-amber-500"
                >
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Distribuição Geográfica</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{totalEquipments > 0 ? Math.ceil(totalEquipments / 2) : 0} ilha{totalEquipments > 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
           
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingData />
            </div>
          ) : filteredEquipments && filteredEquipments.length > 0 ? (
            <>
              <div className="md:hidden space-y-4">
                {filteredEquipments.map(equipment => (
                  <Card key={equipment.id} className="bg-white border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 border-b">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                          style={{ backgroundColor: "#028eab" }}
                        >
                          {equipment.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{equipment.nome}</h3>
                          <p className="text-sm text-gray-500">ID: {equipment.id}</p>
                        </div>
                      </div>
                      
                      {/* Conteúdo do Card */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Código:</span>
                          </div>
                          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
                            {equipment.codigo || "N/A"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Contato:</span>
                          </div>
                          <Badge 
                            className="text-xs font-semibold px-2 py-1" 
                            style={{ backgroundColor: "#028eab", color: "white" }}
                          >
                            {equipment.contato?.telemovel || "N/A"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Localização:</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {typeof equipment.geografia === 'object' 
                              ? `${equipment.geografia?.freguesia || ''}, ${equipment.geografia?.concelho || ''}`
                              : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Oficialização:</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {equipment.data_oficializacao || "N/A"}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rodapé com Ações */}
                      <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                        <PermissionGate module="equipamento" action="list">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-700"
                            onClick={() => router.push(`/dashboard/equipamentos/${equipment.id}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" /> Detalhes
                          </Button>
                        </PermissionGate>
                        
                        <div className="flex gap-2">
                          <PermissionGate module="equipamento" action="create">
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: "#028eab" }}
                              onClick={() => router.push(`/dashboard/equipamentos/editar/${equipment.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          
                          <PermissionGate module="equipamento" action="add">
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: "#028eab" }}
                              onClick={() => router.push(`/dashboard/servicos/criar/${equipment.id}`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="hidden md:block bg-white rounded-lg shadow-sm border">
                <div className="w-full overflow-x-auto" style={{ minWidth: "100%", overflowX: "auto" }}>
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nome</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Código</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Contato</TableHead>
                        {/* <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Localização</TableHead> */}
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Situação do Equipamento</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipments.map((equipment) => (
                        <TableRow 
                          key={equipment.id} 
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
                                    {equipment.nome.charAt(0).toUpperCase()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p> {equipment.nome}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="truncate max-w-[200px]">{equipment.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="px-2 py-1 text-xs font-medium">{equipment?.codigo || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge 
                              className="text-xs font-semibold px-2 py-1" 
                              style={{ backgroundColor: "#028eab", color: "white" }}
                            >
                              {equipment.contato?.telemovel ? equipment.contato.telemovel : "N/A"}
                            </Badge>
                          </TableCell>
                          {/* <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {typeof equipment?.geografia === 'object' 
                                  ? `${equipment?.geografia?.freguesia || ''}, ${equipment.geografia.concelho || ''}`
                                  : 'N/A'}
                              </span>
                            </div>
                          </TableCell> */}
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600">
                                 {typeof equipment.domain_situacao_equipamento === "object"
                        ? equipment.domain_situacao_equipamento?.domain_description
                        : equipment.colecta_lixo_outro || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <PermissionGate module="equipamento" action="list">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-full p-2 h-auto"
                                      style={{ color: "#028eab" }}
                                      onClick={() => router.push(`/dashboard/equipamentos/${equipment.id}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver detalhes</p>
                                  </TooltipContent>
                                </Tooltip>
                              </PermissionGate>
                              
                              <PermissionGate module="equipamento" action="update">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-full p-2 h-auto"
                                      style={{ color: "#028eab" }}
                                      onClick={() => router.push(`/dashboard/equipamentos/editar/${equipment.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar equipamento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </PermissionGate>
                              
                              <PermissionGate module="equipamento" action="add">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-full p-2 h-auto"
                                      style={{ color: "#028eab" }}
                                      onClick={() => router.push(`/dashboard/servicos/criar/${equipment.id}`)}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Adicionar serviço</p>
                                  </TooltipContent>
                                </Tooltip>
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
                      Nenhum equipamento encontrado para &quot;{searchTerm}&quot;
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
                      Nenhum equipamento encontrado
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-4 max-w-md text-center">
                      Adicione equipamentos para poder gerenciar suas informações e vincular valências/respostas sociais
                    </p>
                    <PermissionGate module="equipamento" action="create">
                      <Link href="/dashboard/equipamentos/criar">
                        <Button
                          style={{ backgroundColor: "#028eab", color: "white" }}
                          className="mt-2 hover:bg-opacity-90"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Equipamento
                        </Button>
                      </Link>
                    </PermissionGate>
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
  module: 'equipamento',
  action: 'list'
})(EquipamentosPage);