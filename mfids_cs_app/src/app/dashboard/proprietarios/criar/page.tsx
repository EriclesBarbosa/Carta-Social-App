"use client";
import { ClientLayout } from "@/components/client-layout";
import { OwnerFormStepper } from "@/components/dashboard/organizations/owner-form-stepper";
import { withPermission } from "@/components/permission/withPermission";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { Owner } from "@/types/type";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function CriarProprietario() {
  const router = useRouter();
  const [currentOwner] = useState<Owner | null>(null);

  const { user } = useAuth();

  if (user?.profile?.municipio === null || user?.profile?.municipio === "") {
     <ClientLayout title="Criar Proprietário">
      <h1>Ainda nao tem municipio associado ao seu perfil</h1>
    </ClientLayout>
  }

  return (
    <TooltipProvider>
      <ClientLayout title="Criar Proprietário">
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

                <span className="font-medium">Adicionar Proprietários</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold">Adicionar Proprietário</h1>
                </div>
              </div>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/proprietarios`)}
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
        <div className="mt-6">
          <OwnerFormStepper initialValues={currentOwner || undefined} />
        </div>
      </ClientLayout>
    </TooltipProvider>
  );
}

export default withPermission({
  module: 'organizacao',
  action: 'create'
})(CriarProprietario);
