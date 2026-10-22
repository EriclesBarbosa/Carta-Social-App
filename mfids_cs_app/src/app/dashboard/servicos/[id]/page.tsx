"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil, 
  FileText,
  Clock,
  Building,
  ChevronRight,
  Users,
  Briefcase,
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
import { ClientLayout } from "@/components/client-layout";
//import { toast } from "react-hot-toast";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { useSocialServiceHooks } from "@/hooks/use-services";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";
import PermissionGate from "@/components/permission-gate";
import { useAuth } from "@/contexts/auth-context";

function ServicoSocialDetalhesPage({ params }: any) {
  const data: any = use(params);
  const serviceId = parseInt(data.id);
  const router = useRouter();
  const { hasUserType } = useAuth();
  const { getSocialServiceById } = useSocialServiceHooks();
  const { getEquipmentById } = useEquipmentHooks();
  const { data: service, isLoading } = getSocialServiceById(serviceId);
  
  const { data: equipment, isLoading: isLoadingEquipment } = getEquipmentById(
    service?.equipamento || 0
  );

  if (isLoading || isLoadingEquipment) {
    return (
      <ClientLayout title="Detalhes do Serviço Social">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!service) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Serviço social não encontrado"
          description="Não foi possível encontrar os dados do valências/respostas sociais solicitado."
          buttonText="Voltar para Serviços"
          buttonOnClick={() => router.push("/dashboard/servicos")}
        />
      </ClientLayout>
    );
  }

  if (!equipment) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Equipamento não encontrado"
          description="Não foi possível encontrar o equipamento associado a este serviço."
          buttonText="Voltar para Serviços"
          buttonOnClick={() => router.push("/dashboard/servicos")}
        />
      </ClientLayout>
    );
  }

  return (
    <TooltipProvider>
      <ClientLayout title={`Serviço Social: ${service?.tipo_resposta_social_desc}`}>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push("/dashboard/servicos")}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    Valências/respostas sociais
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Detalhes</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    {service?.tipo_resposta_social_desc?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl md:text-xl font-bold">{service?.tipo_resposta_social_desc}</h1>
                    <div className="flex items-center mt-1">
                      <Badge 
                        className="mr-2 font-medium" 
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {service.codigo_tipo_resposta}
                      </Badge>
                      {service.nr_valencia && (
                        <span className="text-sm text-gray-500">
                          <span className="font-medium">Valência:</span> {service.nr_valencia}
                        </span>
                      )}
                      {service.nr_funcionario && (
                        <span className="text-sm text-gray-500">
                          <span className="font-medium">Nº Funcionario</span> {service.nr_funcionario}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <PermissionGate
                                                  module="equipamento"
                                                  action="update"
                                                >
                                                  {!hasUserType("P") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/dashboard/servicos/editar/${service.id}`)}
                      className="border-gray-300"
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar valências/respostas sociais</p>
                  </TooltipContent>
                </Tooltip>
              )}
                </PermissionGate>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      style={{ backgroundColor: "#028eab" }}
                      onClick={() => router.push(`/dashboard/equipamentos/${service.equipamento}`)}
                    >
                      <Building className="mr-2 h-4 w-4" /> Ver Equipamento
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver detalhes do equipamento</p>
                  </TooltipContent>
                </Tooltip>

              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="divide-y divide-gray-100">
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-gray-400" /> Financiamento da Resposta Social
                    </dt>
                    <dd className="text-sm">
                      <Badge 
                        className={`font-medium ${service.resposta_social_financiada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {service.resposta_social_financiada ? 'Sim' : 'Não'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-gray-400" /> Mensalidade
                    </dt>
                    <dd className="text-sm font-medium">
                      {service.mensalidade_min !== undefined && service.mensalidade_max !== undefined
                        ? `${service.mensalidade_min} - ${service.mensalidade_max}`
                        : "N/A"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Período de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="divide-y divide-gray-100">
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" /> Período
                    </dt>
                    <dd className="text-sm font-medium">
                      {service.domain_periodo_funcionamento ? `ID: ${service.domain_periodo_funcionamento}` : "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" /> Dias de Funcionamento
                    </dt>
                    <dd className="text-sm font-medium">
                      {service.domain_dias_funcionamento ? `ID: ${service.domain_dias_funcionamento}` : "N/A"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {service.operacoes && service.operacoes.length > 0 && (
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Horários de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {service.operacoes.map((operacao, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border">
                      <p className="font-medium text-gray-800">{operacao.dias_funcionamento}</p>
                      <p className="text-sm text-gray-600">
                        De {operacao.horario_abertura} às {operacao.horario_fechamento}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {service.demografias && service.demografias.length > 0 && (
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5" style={{ color: "#028eab" }} /> 
                  Dados Demográficos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-600">Faixa Etária</TableHead>
                      <TableHead className="font-medium text-gray-600 text-center">Total Masculino</TableHead>
                      <TableHead className="font-medium text-gray-600 text-center">Total Feminino</TableHead>
                      <TableHead className="font-medium text-gray-600 text-center">Deficientes Masculino</TableHead>
                      <TableHead className="font-medium text-gray-600 text-center">Deficientes Feminino</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service.demografias.map((demografia, index) => (
                      <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">{demografia.domain_faixa_etaria}</TableCell>
                        <TableCell className="text-center">{demografia.total_masculino}</TableCell>
                        <TableCell className="text-center">{demografia.total_feminino}</TableCell>
                        <TableCell className="text-center">{demografia.deficientes_masculino}</TableCell>
                        <TableCell className="text-center">{demografia.deficientes_feminino}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-medium">
                      <TableCell className="font-medium">TOTAL</TableCell>
                      <TableCell className="text-center">
                        {service.demografias.reduce((sum, item) => sum + (item.total_masculino || 0), 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.demografias.reduce((sum, item) => sum + (item.total_feminino || 0), 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.demografias.reduce((sum, item) => sum + (item.deficientes_masculino || 0), 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {service.demografias.reduce((sum, item) => sum + (item.deficientes_feminino || 0), 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}


export default withPermission({
  module: 'equipamento',
  action: 'list'
})(ServicoSocialDetalhesPage);
