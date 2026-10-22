"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ChevronRight, 
  FileText, 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClientLayout } from "@/components/client-layout";
import { toast } from "react-hot-toast";
import { SocialService } from "@/types/type";
import { SocialServiceFormStepper } from "@/components/dashboard/social-services/social-service-form-stepper";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { useSocialServiceHooks } from "@/hooks/use-services";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";

function CriarServicoSocialPage({ params }: any) {
    const data: any = use(params);
  const equipmentId = parseInt(data.equipmentId);
  const router = useRouter();
  const { getEquipmentById } = useEquipmentHooks();
  const { createSocialService } = useSocialServiceHooks();
  const { data: equipment, isLoading, refetch } = getEquipmentById(equipmentId);

  const handleCreateService = async (data: SocialService): Promise<void> => {
    try {
      await createSocialService(data);
      await refetch();
      await router.push(`/dashboard/equipamentos/${equipmentId}`);
    } catch (error: any) {
      let errorMessage = "Erro ao criar valências/respostas sociais.";
      
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (typeof error.response.data === 'object') {
            errorMessage = JSON.stringify(error.response.data, null, 2);
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(
        <div className="max-h-80 overflow-auto">
          <p className="font-bold mb-2">Erro ao criar valências/respostas sociais:</p>
          <pre className="whitespace-pre-wrap text-xs bg-red-50 p-2 rounded">{errorMessage}</pre>
        </div>,
        {
          duration: 8000,
          style: {
            maxWidth: '500px',
            background: '#FEF2F2',
            color: '#B91C1C'
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <ClientLayout title="Criar Serviço Social">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!equipment) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Equipamento não encontrado"
          description="Não foi possível encontrar o equipamento associado a este serviço."
          buttonText="Voltar para Equipamentos"
          buttonOnClick={() => router.push("/dashboard/equipamentos")}
        />
      </ClientLayout>
    );
  }

  return (
    <TooltipProvider>
      <ClientLayout title={`Adicionar Valências/respostas sociais - ${equipment.nome}`}>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/equipamentos/${equipmentId}`)}
                  className="p-0 h-auto font-normal hover:bg-transparent"
                  size="sm"
                >
                  {equipment.nome}
                </Button>
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="font-medium">Adicionar Valências/respostas sociais</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold">Adicionar Valências/respostas sociais</h1>
                  <p className="text-gray-500">
                    Para o equipamento: {equipment.nome}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/equipamentos/${equipmentId}`)}
                    className="border-gray-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Equipamento
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar para detalhes do equipamento</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <SocialServiceFormStepper
            onComplete={handleCreateService}
            equipmentId={equipmentId}
          />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}


export default withPermission({
  module: 'equipamento',
  action: 'create'
})(CriarServicoSocialPage);