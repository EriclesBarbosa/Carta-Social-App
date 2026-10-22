"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import { ManagerFormStepper } from "@/components/dashboard/organizations/manager-form-stepper";
import { TooltipProvider } from "@/components/ui/tooltip";
import CardHeaderPage from "@/components/cards/card-header-page";
import CardNoDataError from "@/components/cards/card-no-data-error";
import { Manager } from "@/types/type";
import LoadingData from "@/components/loading";
import { formatError } from "@/lib/utils";
import { withPermission } from "@/components/permission/withPermission";

function GestorEditarPage({ params }: any) {
  const router = useRouter();
  const dataParams: any = use(params);
  const { getManagerById, updateManager, getOwnerById } =
    useOrganizationHooks();
  const { data: manager, isLoading: isLoadingManager } = getManagerById(
    parseInt(dataParams.id)
  );

  const { data: owner, isLoading: isLoadingOwner } = getOwnerById(
    manager?.parent_id || 0
  );

  const handleUpdateManager = async (data: Manager) => {
    try {
      const managerData = {
        ...data,
      };

      await updateManager(managerData);
      toast.success("Gestor atualizado com sucesso!");

      router.push(`/dashboard/gestores/${manager?.id}`);
     
    } catch (error) {
      const errorMessage = formatError(error);

      toast.error(
        <div className="max-h-80 overflow-auto">
          <p className="font-bold mb-2">Erro ao atualizar gestor:</p>
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

  const isLoading = isLoadingManager || (manager?.parent_id && isLoadingOwner);

  if (isLoading) {
    return (
      <ClientLayout title="Editar Gestor">
        <LoadingData />
      </ClientLayout>
    );
  }

  if (!manager || !owner) {
    return (
      <ClientLayout title="Erro">
        <CardNoDataError
          title="Gestor ou Proprietário não encontrado"
          description="Não foi possível encontrar os dados do gestor ou proprietário solicitado."
          buttonText="Voltar para Proprietários"
          buttonOnClick={() => router.push("/dashboard/proprietarios")}
        />
      </ClientLayout>
    );
  }

  const handleFinish = () => {
    router.push(`/dashboard/proprietarios/${manager.parent_id}`);
  };

  return (
    <TooltipProvider>
      <ClientLayout title={`Editar Gestor: ${manager.nome}`}>
        <div className="space-y-6">
          <CardHeaderPage isGestor owner={manager} />

          <div>
            <ManagerFormStepper
              owner={owner}
              onComplete={handleUpdateManager}
              onFinish={handleFinish}
              initialValues={manager}
              isEditing={true}
            />
          </div>
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: 'organizacao',
  action: 'update'
})(GestorEditarPage);
