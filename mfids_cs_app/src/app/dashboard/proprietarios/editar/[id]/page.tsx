"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { ClientLayout } from "@/components/client-layout";
import { OwnerFormStepper } from "@/components/dashboard/organizations/owner-form-stepper";
import { TooltipProvider } from "@/components/ui/tooltip";
import CardHeaderPage from "@/components/cards/card-header-page";
import CardNoDataError from "@/components/cards/card-no-data-error";
import LoadingData from "@/components/loading";
import { withPermission } from "@/components/permission/withPermission";

function ProprietarioEditarPage({ params }: any) {
  const pageData: any = use(params);
  const router = useRouter();
  const { getOwnerById } = useOrganizationHooks();
  const { data: owner, isLoading } = getOwnerById(parseInt(pageData.id));

  if (isLoading) {
    return (
      <ClientLayout title="Editar Proprietário">
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

  const initialValues = {
    ...owner,
    geografia: typeof owner.geografia === 'object' 
      ? {
          id: owner.geografia?.id?.toString(),
          ilha: owner.geografia?.ilha,
          concelho: owner.geografia?.concelho,
          freguesia: owner.geografia?.freguesia,
          zona: owner.geografia?.zona,
          lugar: owner.geografia?.lugar
        }
      : { id: owner.geografia?.toString() }
  };

  return (
    <TooltipProvider>
    <ClientLayout title={`Editar Proprietário: ${owner.nome}`}>
      <div className="space-y-6">
        <CardHeaderPage owner={owner} />

        <OwnerFormStepper
          initialValues={initialValues as any}
          isEditing={true}
        />
      </div>
    </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: 'organizacao',
  action: 'update'
})(ProprietarioEditarPage);
