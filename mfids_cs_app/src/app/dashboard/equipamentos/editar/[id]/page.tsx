"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ClientLayout } from "@/components/client-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { Equipment } from "@/types/type";
import { EquipmentFormStepper } from "@/components/dashboard/equipaments/equipment-form-stepper";
import LoadingData from "@/components/loading";
import { formatError } from "@/lib/utils";
import { withPermission } from "@/components/permission/withPermission";

function EquipamentoEditarPage({ params }: any) {
  const pageData: any = use(params);
  const router = useRouter();
  const { getEquipmentById, updateEquipment } = useEquipmentHooks();
  const {
    data: equipment,
    isLoading,
    refetch,
  } = getEquipmentById(parseInt(pageData?.id));

  const handleUpdateEquipment = async (data: Equipment) => {
    try {
      const equipmentData = {
        ...data,
        id: parseInt(pageData?.id),
      };
      await updateEquipment(equipmentData);

      await refetch();

      router.push(`/dashboard/equipamentos/${pageData?.id}`);
    } catch (error) {
      const errorMessage = formatError(error);

      toast.error(
        <div className="max-h-80 overflow-auto">
          <p className="font-bold mb-2">Erro ao salvar equipamento:</p>
          <pre className="whitespace-pre-wrap text-xs bg-red-50 p-2 rounded">
            {errorMessage}
          </pre>
        </div>,
        {
          duration: 8000,
          style: {
            maxWidth: "500px",
            background: "#FEF2F2",
            color: "#B91C1C",
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <ClientLayout title="Editar Equipamento">
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

  return (
    <TooltipProvider>
      <ClientLayout title={`Editar Equipamento: ${equipment.nome}`}>
        <div className="space-y-6">
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
                    onClick={() =>
                      router.push(`/dashboard/equipamentos/${equipment?.id}`)
                    }
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    {equipment.nome}
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Editar</span>
                </div>

              </div>
            </div>
          </div>

          <EquipmentFormStepper
            onComplete={handleUpdateEquipment}
            initialValues={equipment}
            isEditing={true}
          />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}


export default withPermission({
  module: 'equipamento',
  action: 'update'
})(EquipamentoEditarPage);