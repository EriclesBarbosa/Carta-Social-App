"use client";
import { ClientLayout } from "@/components/client-layout";
import { EquipmentFormStepper } from "@/components/dashboard/equipaments/equipment-form-stepper";
import { withPermission } from "@/components/permission/withPermission";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { formatError } from "@/lib/utils";
import { Equipment } from "@/types/type";
import { ArrowLeft, ChevronRight, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

function CriarEquipamento() {
  const router = useRouter();
  const { getEquipments, createEquipment } = useEquipmentHooks();
  const [currentEquipment] = useState<Equipment | null>(null);
  const { refetch } = getEquipments();

  const handleCreateEquipment = async (
  data: Equipment,
  moveToServices: boolean = false
): Promise<void> => {
  try {
    const result = await createEquipment(data);
    await refetch();

    if (moveToServices && result.id) {
      await router.push(`/dashboard/servicos/criar/${result.id}`);
    } else {
      await router.push("/dashboard/equipamentos");
    }
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
    // Re-throw o erro para que o handleSubmit possa capturá-lo
    throw error;
  }
};

   const { user } = useAuth();
  
    if (user?.profile?.municipio === null || user?.profile?.municipio === "") {
       <ClientLayout title="Criar Proprietário">
        <h1>Ainda nao tem municipio associado ao seu perfil</h1>
      </ClientLayout>
    }

  return (
    <TooltipProvider>
      <ClientLayout title="Criar Equipamento">
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

                <span className="font-medium">Adicionar Equipamento</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold">Adicionar Equipamento</h1>
                </div>
              </div>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/equipamentos`)}
                    className="border-gray-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Equipamentos
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar para lista de equipamentos</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <EquipmentFormStepper
            onComplete={handleCreateEquipment}
            initialValues={currentEquipment || undefined}
          />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}


export default withPermission({
  module: 'equipamento',
  action: 'create'
})(CriarEquipamento);