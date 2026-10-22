"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  FileText,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  //Trash,
  ChevronRight,
  Hash,
  Hammer,
  Droplets,
  UserCheck,
  CalendarDays,
  MoreVertical,
  Eye,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ClientLayout } from "@/components/client-layout";
//import { toast } from "react-hot-toast";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { FinancingInfoView } from "@/components/dashboard/equipaments/steps/FinancingInfoView";
import LoadingData from "@/components/loading";
import PermissionGate from "@/components/permission-gate";
import { withPermission } from "@/components/permission/withPermission";
import { useAuth } from "@/contexts/auth-context";
import { formatDateBRIntl } from "@/lib/utils";
import { SocialService } from "@/types/type";

function EquipamentoDetalhesPage({ params }: any) {
  const data: any = use(params);
  const router = useRouter();
  const { hasUserType } = useAuth();
  const { getEquipmentById } = useEquipmentHooks();
  const { getFinancingSourceDomain, getRemodelingSourceDomain } =
    useEquipmentHooks();
  const { data: financingSources } = getFinancingSourceDomain();

  const { data: remodelingSources } = getRemodelingSourceDomain();

  const sourceDescriptions = React.useMemo(() => {
    const combined = [
      ...(financingSources || []),
      ...(remodelingSources || []),
    ];
    return combined.reduce((acc, source: any) => {
      acc[source.id] = source?.domain_description;
      return acc;
    }, {} as Record<number, string>);
  }, [financingSources, remodelingSources]);

  const { data: equipment, isLoading } = getEquipmentById(parseInt(data.id));

  if (isLoading) {
    return (
      <ClientLayout title="Detalhes do Equipamento">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!equipment) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Equipamento não encontrado"
          description="Não foi possível encontrar os dados do equipamento solicitado."
          buttonText="Voltar para Equipamentos"
          buttonOnClick={() => router.push("/dashboard/equipamentos")}
        />
      </ClientLayout>
    );
  }

  console.log("Equipment Data:", equipment);
  return (
    <TooltipProvider>
      <ClientLayout title={`Equipamento: ${equipment.nome}`}>
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/equipamentos")}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    Equipamentos
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Detalhes</span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    {equipment.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-xl md:text-xl font-bold break-words">
                      {equipment.nome}
                    </h1>
                    <div className="flex items-center mt-1">
                      {equipment.codigo && (
                        <span className="text-sm text-gray-500">
                          <span className="font-medium">Código:</span>{" "}
                          {equipment.codigo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <PermissionGate module="equipamento" action="update">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/dashboard/equipamentos/editar/${equipment.id}`
                      )
                    }
                    className="border-gray-300 flex-1 sm:flex-initial"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                </PermissionGate>

                <PermissionGate module="equipamento" action="create">
                  <Button
                    style={{ backgroundColor: "#028eab" }}
                    onClick={() =>
                      router.push(`/dashboard/servicos/criar/${equipment.id}`)
                    }
                    className="flex-1 sm:flex-initial"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">
                      Valências/respostas sociais
                    </span>
                    <span className="sm:hidden">Valências</span>
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Building
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#028eab" }}
                  />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="divide-y divide-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-gray-400" /> ID
                    </dt>
                    <dd className="text-sm font-medium">{equipment.id}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Building className="mr-2 h-4 w-4 text-gray-400" /> Nome
                    </dt>
                    <dd className="text-sm font-medium break-words">
                      {equipment.nome}
                    </dd>
                  </div>
                  {equipment.codigo && (
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Hash className="mr-2 h-4 w-4 text-gray-400" /> Código
                      </dt>
                      <dd className="text-sm">
                        <Badge variant="outline" className="font-medium">
                          {equipment.codigo}
                        </Badge>
                      </dd>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserCheck className="mr-2 h-4 w-4 text-gray-400" />{" "}
                      Gestor Responsável
                    </dt>
                    <dd className="text-sm">
                      <Button
                        variant="link"
                        onClick={() =>
                          router.push(`/dashboard/gestores/${equipment.gestor}`)
                        }
                        className="p-0 h-auto underline text-blue-600 text-left"
                      >
                        Ver detalhes do gestor
                      </Button>
                    </dd>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserCheck className="mr-2 h-4 w-4 text-gray-400" />{" "}
                      Situacao do Equipamento
                    </dt>
                    <dd className="text-sm">
                      <Badge
                        variant="outline"
                        className="font-medium"
                        
                      >
                        {typeof equipment.domain_situacao_equipamento === "object"
                          ? equipment?.domain_situacao_equipamento?.domain_description
                          : "N/A"}
                      </Badge>
                    </dd>
                  </div>
                  
                  {typeof equipment.domain_situacao_equipamento === "object" && [111, 112].includes(Number(equipment?.domain_situacao_equipamento?.id)) ? (
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Data de Encerramento
                      </dt>
                      <dd className="text-sm font-medium">
                        {equipment.data_encerramento ? formatDateBRIntl(equipment.data_encerramento) : "N/A"}
                      </dd>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Data de Oficialização
                      </dt>
                      <dd className="text-sm font-medium">
                        { equipment.data_oficializacao && formatDateBRIntl(equipment.data_oficializacao || "")}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Hammer
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#028eab" }}
                  />
                  Informações de Construção
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <dl className="divide-y divide-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      Tipo de Construção
                    </dt>
                    <dd className="text-sm font-medium break-words">
                      {(typeof equipment.domain_tipo_construcao_outro ===
                        "object" &&
                        equipment.domain_tipo_construcao_outro
                          ?.domain_description) ||
                        "N/A"}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      Tipo de Edificação
                    </dt>
                    <dd className="text-sm font-medium break-words">
                      {(typeof equipment.domain_tipo_edificacao === "object" &&
                        equipment.domain_tipo_edificacao?.domain_description) ||
                        "N/A"}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      Regime de propriedade
                    </dt>
                    <dd className="text-sm">
                      <Badge variant="outline" className="font-medium">
                        {(typeof equipment.domain_regime_propriedade ===
                          "object" &&
                          equipment.domain_regime_propriedade
                            ?.domain_description) ||
                          "N/A"}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      Estado de Conservação
                    </dt>
                    <dd className="text-sm break-words">
                      {(typeof equipment.domain_estado_conservacao ===
                        "object" &&
                        equipment.domain_estado_conservacao
                          ?.domain_description) ||
                        "N/A"}
                    </dd>
                  </div>

                  {(equipment.latitude ||
                    equipment.longitude ||
                    equipment.altura) && (
                    <div className="py-3">
                      <dt className="text-sm font-medium text-gray-500 mb-2">
                        Coordenadas
                      </dt>
                      <dd className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {equipment.latitude && (
                          <div className="text-sm bg-gray-50 p-2 rounded border">
                            <span className="block text-xs text-gray-500">
                              Latitude
                            </span>
                            <span className="font-medium break-all">
                              {equipment.latitude}
                            </span>
                          </div>
                        )}

                        {equipment.longitude && (
                          <div className="text-sm bg-gray-50 p-2 rounded border">
                            <span className="block text-xs text-gray-500">
                              Longitude
                            </span>
                            <span className="font-medium break-all">
                              {equipment.longitude}
                            </span>
                          </div>
                        )}

                        {equipment.altura && (
                          <div className="text-sm bg-gray-50 p-2 rounded border">
                            <span className="block text-xs text-gray-500">
                              Altura
                            </span>
                            <span className="font-medium">
                              {equipment.altura} m
                            </span>
                          </div>
                        )}
                      </dd>
                    </div>
                  )}

                  {equipment.ponto_referencia && (
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" /> Ponto
                        de Referência
                      </dt>
                      <dd className="text-sm font-medium break-words">
                        {equipment.ponto_referencia}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Phone
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#028eab" }}
                  />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {typeof equipment.contato === "object" ? (
                  <dl className="divide-y divide-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Endereço
                      </dt>
                      <dd className="text-sm text-left sm:text-right break-words">
                        {equipment.contato.endereco || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Caixa
                        Postal
                      </dt>
                      <dd className="text-sm">
                        {equipment.contato.caixa_postal || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Telefone
                      </dt>
                      <dd className="text-sm">
                        {equipment.contato.telefone || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Telemóvel
                      </dt>
                      <dd
                        className="text-sm font-medium"
                        style={{ color: "#028eab" }}
                      >
                        {equipment.contato.telemovel || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Email
                      </dt>
                      <dd className="text-sm break-all">
                        {equipment.contato.email ? (
                          <a
                            href={`mailto:${equipment.contato.email}`}
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {equipment.contato.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-gray-400" /> Website
                      </dt>
                      <dd className="text-sm break-all">
                        {equipment.contato.website ? (
                          <a
                            href={
                              equipment.contato.website.startsWith("http")
                                ? equipment.contato.website
                                : `https://${equipment.contato.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {equipment.contato.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">
                      Informações de contato não disponíveis
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Droplets
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#028eab" }}
                  />
                  Utilitários
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-50 p-3 rounded border">
                      <div>
                        <span className="text-sm text-gray-500">
                          Eletricidade
                        </span>
                        <div className="font-medium">
                          {equipment.possui_eletricidade ? "Sim" : "Não"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <div>
                        <span className="text-sm text-gray-500">
                          Ligação à rede pública de distribuição de água
                        </span>
                        <div className="font-medium">
                          {equipment.domain_ligacao_rede_publica
                            ? "Sim"
                            : "Não"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded border">
                      <div>
                        <span className="text-sm text-gray-500">
                          Equipamento tem cozinha
                        </span>
                        <div className="font-medium">
                          {equipment.possui_cozinha ? "Sim" : "Não"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <div>
                        <span className="text-sm text-gray-500">
                          Acesso para Deficientes
                        </span>
                        <div className="font-medium">
                          {equipment.acesso_deficientes ? "Sim" : "Não"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500">
                        Equipamento tem sanita ou latrina
                      </span>
                      <div className="font-medium">
                        {equipment.domain_sanita_latrina ? "Sim" : "Não"}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Sistema de evacuação das águas residuais
                      </span>
                      <div className="font-medium">
                        {equipment.domain_evacuacao_agua ? "Sim" : "Não"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded border">
                    <span className="text-sm text-gray-500">
                      O lixo deste equipamento é
                    </span>
                    <div className="font-medium break-words">
                      {typeof equipment.domain_colecta_lixo === "object"
                        ? equipment.domain_colecta_lixo?.domain_description
                        : equipment.colecta_lixo_outro || "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Card */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 pb-3">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <MapPin
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                  style={{ color: "#028eab" }}
                />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {typeof equipment?.geografia === "object" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="p-4 border-b sm:border-r lg:border-b-0">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Ilha
                    </dt>
                    <dd className="font-medium" style={{ color: "#028eab" }}>
                      {equipment.geografia?.ilha || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b lg:border-r lg:border-b-0">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Concelho
                    </dt>
                    <dd className="font-medium">
                      {equipment.geografia?.concelho || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b sm:border-r sm:border-b-0 lg:border-r">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Freguesia
                    </dt>
                    <dd className="font-medium">
                      {equipment.geografia?.freguesia || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b sm:border-r sm:border-b-0 lg:border-r">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Localidade
                    </dt>
                    <dd className="font-medium">
                      {equipment.geografia?.zona || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Zona
                    </dt>
                    <dd className="font-medium">
                      {equipment.geografia?.lugar || "N/A"}
                    </dd>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">
                    Informações de localização não disponíveis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Section - Responsive */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <FileText
                  className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                  style={{ color: "#028eab" }}
                />
                Valências/respostas sociais ({equipment?.servicos?.length || 0})
              </CardTitle>
              <PermissionGate module="equipamento" action="create">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/servicos/criar/${equipment.id}`)
                  }
                  style={{ backgroundColor: "#028eab" }}
                  className="w-full sm:w-auto"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    Valências/respostas sociais
                  </span>
                  <span className="sm:hidden">Valências</span>
                </Button>
              </PermissionGate>
            </CardHeader>
            <CardContent className="p-0">
              {equipment?.servicos && equipment?.servicos.length > 0 ? (
                <>
                  {/* Desktop Table - Hidden on mobile */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-medium text-gray-600">
                            Tipo Resposta Social
                          </TableHead>
                          <TableHead className="font-medium text-gray-600">
                            Data inicio funcionamento
                          </TableHead>
                          <TableHead className="font-medium text-gray-600">
                            Capacidade
                          </TableHead>
                          <TableHead className="font-medium text-gray-600">
                            Licenciado
                          </TableHead>
                          <TableHead className="text-right font-medium text-gray-600">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment?.servicos.map((service: SocialService) => (
                          <TableRow
                            key={service.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                
                                <span className="truncate">{service.tipo_resposta_social_desc || "N/A"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className="font-medium text-xs"
                                style={{
                                  backgroundColor: "#028eab",
                                  color: "white",
                                }}
                              >
                                {service.data_inicio_funcionamento}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-medium text-xs"
                              >
                                {service.capacidade_instalada} utentes
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`font-medium text-xs ${
                                  service.licenciado
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {service.licenciado ? "Sim" : "Não"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <PermissionGate
                                  module="equipamento"
                                  action="update"
                                >
                                  {!hasUserType("P") && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full p-2 h-auto hover:bg-gray-100"
                                        style={{ color: "#028eab" }}
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/servicos/editar/${service.id}`
                                          )
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar serviço</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  )}
                                </PermissionGate>
                                <PermissionGate
                                  module="equipamento"
                                  action="list"
                                >
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full p-2 h-auto hover:bg-gray-100"
                                        style={{ color: "#028eab" }}
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/servicos/${service.id}`
                                          )
                                        }
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver serviço</p>
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

                  {/* Mobile Card Layout - Visible on mobile only */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {equipment?.servicos.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ backgroundColor: "#028eab" }}
                            >
                              {service.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-sm break-words mb-2">
                                {service.nome}
                              </h3>
                              <div className="flex flex-col gap-2">
                                <Badge
                                  className="font-medium text-xs w-fit"
                                  style={{
                                    backgroundColor: "#028eab",
                                    color: "white",
                                  }}
                                >
                                  Início: {service.data_inicio_funcionamento}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="font-medium text-xs w-fit"
                                >
                                  {service.capacidade_instalada} utentes
                                </Badge>
                                <Badge
                                  className={`font-medium text-xs w-fit ${
                                    service.licenciado
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  Licenciado:{" "}
                                  {service.licenciado ? "Sim" : "Não"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <PermissionGate
                              module="equipamento"
                              action="update"
                            >
                              {!hasUserType("P") && (
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/servicos/editar/${service.id}`
                                      )
                                    }
                                    className="text-sm"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar serviço
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              )}
                            </PermissionGate>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum valências/respostas sociais encontrado
                  </h3>
                  
                </div>
              )}
            </CardContent>
          </Card>

          {equipment.fontes_financiamento &&
            equipment.fontes_financiamento.length > 0 && (
              <FinancingInfoView
                fontesFinanciamento={equipment.fontes_financiamento}
                sourceDescriptions={sourceDescriptions}
                title="Fontes de Financiamento"
              />
            )}
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: "equipamento",
  action: "list",
})(EquipamentoDetalhesPage);
