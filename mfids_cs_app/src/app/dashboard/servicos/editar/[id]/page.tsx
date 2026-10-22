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

function EditarServicoSocialPage({ params }: any) {
  const data: any = use(params);
  const serviceId = parseInt(data.id);
  const router = useRouter();
  const { getSocialServiceById } = useSocialServiceHooks();
  const { getEquipmentById } = useEquipmentHooks();
  const { updateSocialService } = useSocialServiceHooks();
  const { data: service, isLoading } = getSocialServiceById(serviceId);
  
  const { data: equipment, isLoading: isLoadingEquipment } = getEquipmentById(
    service?.equipamento || 0
  );

  const handleUpdateService = async (data: SocialService) => {
    try {
      await updateSocialService({
        ...data,
        id: serviceId,
      });
      router.push(`/dashboard/equipamentos/${data.equipamento}`);
    } catch (error) {
      console.error("Erro ao atualizar valências/respostas sociais:", error);
      toast.error("Erro ao atualizar valências/respostas sociais.");
    }
  };

  if (isLoading || isLoadingEquipment) {
    return (
      <ClientLayout title="Editar Serviço Social">
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
          buttonText="Voltar para Equipamentos"
          buttonOnClick={() => router.push("/dashboard/equipamentos")}
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
          buttonText="Voltar para Equipamentos"
          buttonOnClick={() => router.push("/dashboard/equipamentos")}
        />
      </ClientLayout>
    );
  }

  return (
    <TooltipProvider>
      <ClientLayout title={`Editar Serviço Social - ${service.nome}`}>
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
                  onClick={() => router.push(`/dashboard/equipamentos/${service.equipamento}`)}
                  className="p-0 h-auto font-normal hover:bg-transparent"
                  size="sm"
                >
                  {equipment.nome}
                </Button>
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="font-medium">Editar Serviço</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold">Editar Serviço Social</h1>
                  <p className="text-gray-500">
                    {service.nome} - {equipment.nome}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/equipamentos/${service.equipamento}`)}
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
            onComplete={handleUpdateService}
            equipmentId={service.equipamento}
            initialValues={service}
            isEditing
          />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}


export default withPermission({
  module: 'equipamento',
  action: 'update'
})(EditarServicoSocialPage);
