"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddManagerComponent } from "@/components/dashboard/organizations/add-manager-component";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { Manager } from "@/types/type";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";
import { useAuth } from "@/contexts/auth-context";

function CreateGestorPage({ params }: any) {
  const router = useRouter();
  const data: any = use(params);

  const { getOwnerById, createManager } = useOrganizationHooks();
  const {
    data: owner,
    isLoading: isLoadingOwner,
    refetch,
  } = getOwnerById(parseInt(data?.ownerId));
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);

  const handleCreateManager = async (data: Manager) => {
    try {
      const newManager = await createManager(data);
      toast.success("Gestor adicionado com sucesso!");
      setManagers([...managers, newManager]);
      refetch();
      return newManager;
    } catch (error) {
      toast.error("Erro ao adicionar gestor.");
      throw error;
    }
  };

  const handleFinish = () => {
    router.push(`/dashboard/proprietarios/${owner?.id}`);
  };

  if (isLoadingOwner) {
    return (
      <ClientLayout title="Adicionando Gestor">
        <LoadingData />
      </ClientLayout>
    );
  }

  
    
  
    if (user?.profile?.municipio === null || user?.profile?.municipio === "") {
      <ClientLayout title="Adicionando Gestor">
        <h1>Ainda nao tem municipio associado ao seu perfil</h1>
       </ClientLayout>
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
      <ClientLayout title={`Adicionar Gestor para ${owner.nome}`}>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                  <Button
                    variant="ghost"
                    onClick={() =>
                      router.push(`/dashboard/proprietarios/${owner.id}`)
                    }
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    {owner.nome}
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Adicionar Gestor</span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-xl font-bold">Adicionar Gestor</h1>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">
                        Para o proprietário:
                      </span>
                      <Badge
                        className="ml-2 font-medium"
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {owner.nome}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/proprietarios/${owner.id}`)
                      }
                      className="border-gray-300"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para Proprietário
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voltar para detalhes do proprietário</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {managers.length > 0 && (
            <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 p-4 border-b border-green-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-2 text-white">
                    <span className="text-xs font-medium">
                      {managers.length}
                    </span>
                  </div>
                  <h3 className="font-medium text-green-800">
                    Gestores adicionados nesta sessão
                  </h3>
                </div>
              </div>
              <ul className="divide-y divide-gray-100">
                {managers.map((manager) => (
                  <li key={manager.id} className="p-4 flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold"
                      style={{ backgroundColor: "#028eab" }}
                    >
                      {manager?.nome && manager?.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{manager.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          NIF: {manager.nif}
                        </Badge>
                        <Badge
                          style={{ backgroundColor: "#028eab", color: "white" }}
                          className="text-xs"
                        >
                          {manager.natureza_juridica}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() =>
                        router.push(`/dashboard/gestores/${manager.id}`)
                      }
                    >
                      Ver Detalhes
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AddManagerComponent
            owner={owner}
            onComplete={handleCreateManager}
            onFinish={handleFinish}
          />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: 'organizacao',
  action: 'create'
})(CreateGestorPage);
