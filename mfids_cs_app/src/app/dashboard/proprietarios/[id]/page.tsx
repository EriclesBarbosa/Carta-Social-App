"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  Eye,
  ChevronRight,
  Hash,
  MoreVertical,
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
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import CardNoDataError from "@/components/cards/card-no-data-error";
import LoadingData from "@/components/loading";
import PermissionGate from "@/components/permission-gate";
import { useAuth } from "@/contexts/auth-context";

export default function ProprietarioDetalhesPage({ params }: any) {
  const { hasUserType } = useAuth();
  const data: any = use(params);
  const router = useRouter();

  const { getOwnerById } = useOrganizationHooks();
  const { data: owner, isLoading } = getOwnerById(parseInt(data.id));

  if (isLoading) {
    return (
      <ClientLayout title="Detalhes do Proprietário">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!owner) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Proprietário não encontrado"
          description="Não foi possível encontrar os dados do proprietário solicitado."
          buttonText="Voltar para Proprietários"
          buttonOnClick={() => router.push("/dashboard/proprietarios")}
        />
      </ClientLayout>
    );
  }

  return (
    <TooltipProvider>
      <ClientLayout title={`Proprietário: ${owner.nome}`}>
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/proprietarios")}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    Proprietários
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Detalhes</span>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    {owner.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-xl md:text-xl font-bold break-words">
                      {owner.nome}
                    </h1>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        <span className="font-medium">NIF:</span> {owner.nif}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <PermissionGate module="organizacao" action="update">
                  {!hasUserType("G") && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/proprietarios/editar/${owner.id}`)
                    }
                    className="border-gray-300 flex-1 sm:flex-initial"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  )}
                </PermissionGate>
                <PermissionGate module="organizacao" action="create">
                  {!hasUserType("G") && (
                    <Button
                      style={{ backgroundColor: "#028eab" }}
                      onClick={() =>
                        router.push(`/dashboard/gestores/criar/${owner.id}`)
                      }
                      className="flex-1 sm:flex-initial"
                    >
                      <Users className="mr-2 h-4 w-4" /> Adicionar Gestor
                    </Button>
                  )}
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
                    <dd className="text-sm font-medium">{owner.id}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Building className="mr-2 h-4 w-4 text-gray-400" /> Nome
                    </dt>
                    <dd className="text-sm font-medium break-words">
                      {owner.nome}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-gray-400" /> NIF
                    </dt>
                    <dd className="text-sm">
                      <Badge variant="outline" className="font-medium">
                        {owner.nif}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Building className="mr-2 h-4 w-4 text-gray-400" />{" "}
                      Natureza Jurídica
                    </dt>
                    <dd className="text-sm">
                      <Badge
                        className="font-medium"
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {owner.natureza_juridica === "Outro (ESPECIFIQUE)"
                          ? owner.natureza_juridica_outro
                          : owner.natureza_juridica}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

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
                {typeof owner.contato === "object" ? (
                  <dl className="divide-y divide-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Endereço
                      </dt>
                      <dd className="text-sm text-left sm:text-right break-words">
                        {owner.contato.endereco || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Caixa
                        Postal
                      </dt>
                      <dd className="text-sm">
                        {owner.contato.caixa_postal || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />{" "}
                        Telefone
                      </dt>
                      <dd className="text-sm">
                        {owner.contato.telefone || "N/A"}
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
                        {owner.contato.telemovel || "N/A"}
                      </dd>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1 sm:gap-0">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" /> Email
                      </dt>
                      <dd className="text-sm break-all">
                        {owner.contato.email ? (
                          <a
                            href={`mailto:${owner.contato.email}`}
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {owner.contato.email}
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
                        {owner.contato.website ? (
                          <a
                            href={
                              owner.contato.website.startsWith("http")
                                ? owner.contato.website
                                : `https://${owner.contato.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                            style={{ color: "#028eab" }}
                          >
                            {owner.contato.website}
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
              {typeof owner?.geografia === "object" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="p-4 border-b sm:border-r lg:border-b-0">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Ilha
                    </dt>
                    <dd className="font-medium" style={{ color: "#028eab" }}>
                      {owner.geografia?.ilha || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b lg:border-r lg:border-b-0">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Concelho
                    </dt>
                    <dd className="font-medium">
                      {owner.geografia?.concelho || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b sm:border-r sm:border-b-0 lg:border-r">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Freguesia
                    </dt>
                    <dd className="font-medium">
                      {owner.geografia?.freguesia || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4 border-b sm:border-r sm:border-b-0 lg:border-r">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Localidade
                    </dt>
                    <dd className="font-medium">
                      {owner.geografia?.zona || "N/A"}
                    </dd>
                  </div>
                  <div className="p-4">
                    <dt className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Zona
                    </dt>
                    <dd className="font-medium">
                      {owner.geografia?.lugar || "N/A"}
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
          {!hasUserType("G") && (
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Users
                    className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#028eab" }}
                  />
                  Gestores ({owner.gestor?.length || 0})
                </CardTitle>
                <PermissionGate module="organizacao" action="create">
                  {!hasUserType("P") && (
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/gestores/criar/${owner.id}`)
                      }
                      style={{ backgroundColor: "#028eab" }}
                      className="w-full sm:w-auto"
                    >
                      <Users className="mr-2 h-4 w-4" /> Adicionar Gestor
                    </Button>
                  )}
                </PermissionGate>
              </CardHeader>
              <CardContent className="p-0">
                {owner.gestor && owner.gestor.length > 0 ? (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-medium text-gray-600">
                              Nome
                            </TableHead>
                            <TableHead className="font-medium text-gray-600">
                              NIF
                            </TableHead>
                            <TableHead className="font-medium text-gray-600">
                              Natureza Jurídica
                            </TableHead>
                            <TableHead className="text-right font-medium text-gray-600">
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owner.gestor.map((gestor) => (
                            <TableRow
                              key={gestor.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold shrink-0"
                                    style={{ backgroundColor: "#028eab" }}
                                  >
                                    {gestor.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate">
                                    {gestor.nome}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="font-medium"
                                >
                                  {gestor.nif}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className="font-medium text-xs"
                                  style={{
                                    backgroundColor: "#028eab",
                                    color: "white",
                                  }}
                                >
                                  {gestor.natureza_juridica}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full p-2 h-auto hover:bg-gray-100"
                                        style={{ color: "#028eab" }}
                                        onClick={() =>
                                          router.push(
                                            `/dashboard/gestores/${gestor.id}`
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
                                  <PermissionGate module="organizacao" action="update">
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
                                              `/dashboard/gestores/editar/${gestor.id}`
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

                    <div className="md:hidden divide-y divide-gray-100">
                      {owner.gestor.map((gestor) => (
                        <div
                          key={gestor.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                style={{ backgroundColor: "#028eab" }}
                              >
                                {gestor.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm truncate">
                                  {gestor.nome}
                                </h3>
                                <div className="flex flex-col gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className="font-medium text-xs w-fit"
                                  >
                                    NIF: {gestor.nif}
                                  </Badge>
                                  <Badge
                                    className="font-medium text-xs w-fit"
                                    style={{
                                      backgroundColor: "#028eab",
                                      color: "white",
                                    }}
                                  >
                                    {gestor.natureza_juridica}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Mobile Actions Dropdown */}
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
                              
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/gestores/${gestor.id}`
                                    )
                                  }
                                  className="text-sm"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <PermissionGate module="organizacao" action="update">
                                  {!hasUserType("P") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/gestores/editar/${gestor.id}`
                                        )
                                      }
                                      className="text-sm"
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                  )}
                                </PermissionGate>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Users className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum gestor encontrado
                    </h3>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}
