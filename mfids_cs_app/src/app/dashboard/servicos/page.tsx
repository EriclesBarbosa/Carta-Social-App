"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pencil, 
  Eye, 
  Trash, 
  Search,
  Building,
  FileText,
  Users,
  CheckCircle,
  Layers
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
import { toast } from "react-hot-toast";
import { ClientLayout } from "@/components/client-layout";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { useSocialServiceHooks } from "@/hooks/use-services";
import { withPermission } from "@/components/permission/withPermission";
import { Card, CardContent } from "@/components/ui/card";
import LoadingData from "@/components/loading";
import PermissionGate from "@/components/permission-gate";

function ServicosPage() {
  const router = useRouter();
  const { getSocialServices, deleteSocialService } = useSocialServiceHooks();
  const { getEquipments } = useEquipmentHooks();
  const { data: services, isLoading, refetch } = getSocialServices();
  const { data: equipments } = getEquipments();
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleDeleteService = async (id: number) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este valências/respostas sociais?"
      )
    ) {
      try {
        await deleteSocialService(id);
        toast.success("Serviço social excluído com sucesso!");
        refetch();
      } catch {
        toast.error("Erro ao excluir valências/respostas sociais.");
      }
    }
  };

  const getEquipmentName = (equipmentId: number) => {
    const equipment = equipments?.find(eq => eq.id === equipmentId);
    return equipment ? equipment.nome : 'Equipamento não encontrado';
  };

  const totalServices = services?.length || 0;

  const filteredServices = useMemo(() => {
    return services?.filter(service => 
      service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.codigo_tipo_resposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEquipmentName(service.equipamento).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm, equipments]);

  return (
    <TooltipProvider>
      <ClientLayout title="Valências/respostas sociais">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Card */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-xl md:text-xl font-bold">Valências/respostas sociais</h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Gerencie os valências/respostas sociais oferecidos pelos equipamentos
                  </p>
                </div>
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
                  placeholder="Buscar por nome, tipo ou equipamento..."
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
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total de Serviços</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{totalServices}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-amber-500"
                >
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total de Equipamentos</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">{equipments?.length || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-green-500"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Capacidade Total</p>
                  <p className="text-xl sm:text-xl md:text-xl font-bold">
                    {services?.reduce((total, service) => total + (service.capacidade_instalada || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela para desktop e cards para mobile */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingData />
            </div>
          ) : filteredServices && filteredServices.length > 0 ? (
            <>
              {/* Cards para Mobile */}
              <div className="md:hidden space-y-4">
                {filteredServices.map(service => (
                  <Card key={service.id} className="bg-white border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-center p-4 border-b">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold"
                          style={{ backgroundColor: "#028eab" }}
                        >
                          {service.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{service.nome}</h3>
                          <Badge 
                            className="text-xs font-semibold px-2 py-1 mt-1" 
                            style={{ backgroundColor: "#028eab", color: "white" }}
                          >
                            {service.codigo_tipo_resposta}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Conteúdo do Card */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Equipamento:</span>
                          </div>
                          <div className="text-sm text-gray-600 truncate max-w-[180px] text-right">
                            {getEquipmentName(service.equipamento)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Capacidade:</span>
                          </div>
                          <Badge variant="outline" className="px-2 py-1 text-xs font-medium">
                            {service.capacidade_instalada} utentes
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Licenciado:</span>
                          </div>
                          <Badge 
                            className={`text-xs font-semibold px-2 py-1 ${
                              service.licenciado 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {service.licenciado ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                        
                        {service.data_inicio_funcionamento && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Layers className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm font-medium text-gray-700">Início:</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {service.data_inicio_funcionamento}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Rodapé com Ações */}
                      <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-700"
                          onClick={() => router.push(`/dashboard/equipamentos/${service.equipamento}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> Ver Equipamento
                        </Button>
                        
                        <div className="flex gap-2">
                          <PermissionGate module="equipamento" action="create">
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: "#028eab" }}
                              onClick={() => router.push(`/dashboard/servicos/editar/${service.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          
                          <PermissionGate module="equipamento" action="delete">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => handleDeleteService(service.id!)}
                            >
                              <Trash className="h-4 w-4" />
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
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Nome</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Tipo</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Equipamento</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Capacidade</TableHead>
                        <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Licenciado</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow 
                          key={service.id} 
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold cursor-help flex-shrink-0"
                                    style={{ backgroundColor: "#028eab" }}
                                  >
                                    {service.nome.charAt(0).toUpperCase()}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>ID: {service.id}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="truncate max-w-[150px]">{service.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className="text-xs font-semibold px-2 py-1 cursor-help" 
                                  style={{ backgroundColor: "#028eab", color: "white" }}
                                >
                                  {service.codigo_tipo_resposta}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tipo de resposta social</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="text-sm text-gray-600 truncate max-w-[150px]">
                                {getEquipmentName(service.equipamento)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-2 py-1 text-xs font-medium cursor-help">
                                  {service.capacidade_instalada} utentes
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Capacidade instalada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`text-xs font-semibold px-2 py-1 ${
                                service.licenciado 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {service.licenciado ? 'Sim' : 'Não'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full p-2 h-auto"
                                    style={{ color: "#028eab" }}
                                    onClick={() => router.push(`/dashboard/equipamentos/${service.equipamento}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver equipamento</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <PermissionGate module="equipamento" action="create">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-full p-2 h-auto"
                                      style={{ color: "#028eab" }}
                                      onClick={() => router.push(`/dashboard/servicos/editar/${service.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar serviço</p>
                                  </TooltipContent>
                                </Tooltip>
                              </PermissionGate>
                              
                              {/* <PermissionGate module="equipamento" action="delete">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-full p-2 h-auto text-red-500"
                                      onClick={() => handleDeleteService(service.id!)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir serviço</p>
                                  </TooltipContent>
                                </Tooltip>
                              </PermissionGate> */}
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
                      Nenhum valências/respostas sociais encontrado para &quot;{searchTerm}&quot;
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
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-3">
                      Nenhum valências/respostas sociais encontrado
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mb-4 max-w-md text-center">
                      Adicione valências/respostas sociais aos equipamentos para poder gerenciar suas informações
                    </p>
                    <Button
                      style={{ backgroundColor: "#028eab", color: "white" }}
                      className="mt-2 hover:bg-opacity-90"
                      onClick={() => router.push("/dashboard/equipamentos")}
                    >
                      <Building className="mr-2 h-4 w-4" />
                      Ver Equipamentos
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
  module: 'equipamento',
  action: 'list'
})(ServicosPage);