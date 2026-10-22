"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building,
  User,
  Link as LinkIcon,
  ChevronRight,
  Hash,
  FileText,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CardNoDataError from "@/components/cards/card-no-data-error";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";
import PermissionGate from "@/components/permission-gate";
import { useAuth } from "@/contexts/auth-context";

function GestorDetalhesPage({ params }: any) {
  const router = useRouter();
     const {  hasUserType } = useAuth();
  const data: any = use(params);
  const { getManagerById, getOwnerById } = useOrganizationHooks();
  const { data: manager, isLoading: isLoadingManager } = getManagerById(parseInt(data.id));
  
  const { data: owner, isLoading: isLoadingOwner } = getOwnerById(manager?.parent_id || 0);


  const isLoading = isLoadingManager || (manager?.parent_id && isLoadingOwner);

  if (isLoading) {
    return (
      <ClientLayout title="Detalhes do Gestor">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!manager) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Gestor não encontrado"
          description="Não foi possível encontrar os dados do gestor solicitado."
          buttonText="Voltar para Gestores"
          buttonOnClick={() => router.push("/dashboard/gestores")}
        />
      </ClientLayout>
    );
  }

  return (
    <TooltipProvider>
      <ClientLayout title={`Gestor: ${manager.nome}`}>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push("/dashboard/gestores")}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    Gestores
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Detalhes</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    {manager.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl md:text-xl font-bold">{manager.nome}</h1>
                    <div className="flex items-center mt-1">
                      <Badge 
                        className="mr-2 font-medium" 
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {manager.natureza_juridica}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        <span className="font-medium">NIF:</span> {manager.nif}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <PermissionGate module="organizacao" action="update">
                                  {!hasUserType("P") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/gestores/editar/${manager.id}`)}
                      className="border-gray-300"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar informações do gestor</p>
                  </TooltipContent>
                </Tooltip>
              )}
                </PermissionGate>
                
                
                {owner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        style={{ backgroundColor: "#028eab" }}
                        size="sm"
                        onClick={() => router.push(`/dashboard/proprietarios/${owner.id}`)}
                      >
                        <Building className="mr-2 h-4 w-4" /> Ver Proprietário
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver detalhes do proprietário</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* Info cards section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Basic info card */}
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="divide-y divide-gray-100">
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-gray-400" /> ID
                    </dt>
                    <dd className="text-sm font-medium">{manager.id}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-400" /> Nome
                    </dt>
                    <dd className="text-sm font-medium">{manager.nome}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-gray-400" /> NIF
                    </dt>
                    <dd className="text-sm">
                      <Badge variant="outline" className="font-medium">
                        {manager.nif}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-gray-400" /> Natureza Jurídica
                    </dt>
                    <dd className="text-sm">
                      <Badge 
                        className="font-medium"
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {manager.natureza_juridica}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Users className="mr-2 h-4 w-4 text-gray-400" /> Função
                    </dt>
                    <dd className="text-sm">
                      <Badge variant="secondary" className="font-medium">
                        Gestor
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Phone className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {typeof manager.contato === 'object' ? (
                  <dl className="divide-y divide-gray-100">
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" /> Endereço
                      </dt>
                      <dd className="text-sm text-right flex-1 ml-4">{manager.contato.endereco || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Caixa Postal
                      </dt>
                      <dd className="text-sm">{manager.contato.caixa_postal || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" /> Telefone
                      </dt>
                      <dd className="text-sm">{manager.contato.telefone || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" /> Telemóvel
                      </dt>
                      <dd className="text-sm font-medium" style={{ color: "#028eab" }}>
                        {manager.contato.telemovel || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Email
                      </dt>
                      <dd className="text-sm">
                        {manager.contato.email ? (
                          <a 
                            href={`mailto:${manager.contato.email}`} 
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {manager.contato.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between py-3">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-gray-400" /> Website
                      </dt>
                      <dd className="text-sm">
                        {manager.contato.website ? (
                          <a 
                            href={manager.contato.website.startsWith('http') ? manager.contato.website : `https://${manager.contato.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {manager.contato.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Informações de contato não disponíveis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Building className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Proprietário Associado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {owner ? (
                  <div className="p-0">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold"
                        style={{ backgroundColor: "#028eab" }}
                      >
                        {owner.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-base">{owner.nome}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">NIF: {owner.nif}</Badge>
                          <Badge 
                            style={{ backgroundColor: "#028eab", color: "white" }} 
                            className="text-xs"
                          >
                            {owner.natureza_juridica}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {typeof owner.contato === 'object' && (
                      <div className="space-y-2 mb-4">
                        {owner.contato.telemovel && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{owner.contato.telemovel}</span>
                          </div>
                        )}
                        {owner.contato.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <a 
                              href={`mailto:${owner.contato.email}`}
                              className="text-sm hover:underline"
                              style={{ color: "#028eab" }}
                            >
                              {owner.contato.email}
                            </a>
                          </div>
                        )}
                        {typeof owner.geografia === 'object' && owner.geografia?.ilha && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{owner?.geografia?.ilha}, {owner?.geografia?.concelho}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-4 pt-2 border-t border-gray-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/proprietarios/${owner.id}`)}
                            className="text-sm"
                            style={{ color: "#028eab", borderColor: "#e2e8f0" }}
                          >
                            <LinkIcon className="mr-2 h-4 w-4" /> Ver Detalhes Completos
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver página completa do proprietário</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-amber-700 text-sm">
                      Não foi possível carregar as informações do proprietário associado.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push("/dashboard/proprietarios")}
                    >
                      <Building className="mr-2 h-4 w-4" /> Ver Proprietários
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {typeof manager.geografia === 'object' && (
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Localização Geográfica
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-6">
                  
                  <div>
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">Ilha</dt>
                    <dd className="font-medium" style={{ color: "#028eab" }}>{manager?.geografia?.ilha || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">Concelho</dt>
                    <dd className="font-medium">{manager?.geografia?.concelho || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">Freguesia</dt>
                    <dd className="font-medium">{manager?.geografia?.freguesia || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">Localidade</dt>
                    <dd className="font-medium">{manager.geografia?.zona || "N/A"}</dd>
                  </div>
                  {manager.geografia?.lugar && (
                    <div>
                      <dt className="text-xs font-medium uppercase text-gray-500 mb-1">Zona</dt>
                      <dd className="font-medium">{manager.geografia?.lugar}</dd>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: 'organizacao',
  action: 'list'
})(GestorDetalhesPage);
