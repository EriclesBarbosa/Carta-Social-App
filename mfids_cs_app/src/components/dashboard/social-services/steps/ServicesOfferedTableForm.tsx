"use client";

import React, { useEffect, useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { InfoIcon } from "lucide-react";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { SocialServiceFormValues } from "@/lib/schemas/services-schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ServicesOfferedTableFormProps {
  form: UseFormReturn<SocialServiceFormValues>;
}

export function ServicesOfferedTableForm({
  form,
}: ServicesOfferedTableFormProps) {
  const { getServicePrestationDomain } = useEquipmentHooks();
  const { data: serviceTypes, isLoading: isLoadingServices } =
    getServicePrestationDomain();

  const [otherService, setOtherService] = useState("");

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "servicos_oferecidos",
    keyName: "formId",
  });

  useEffect(() => {
    const existingValues = form.getValues("servicos_oferecidos") || [];
    const outros = form.getValues("servicos_oferecidos_outros") || "";
    setOtherService(outros);

    if (existingValues.length > 0 && fields.length === 0) {
      replace(existingValues);
    }
  }, [form, fields.length, replace]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "servicos_oferecidos_outros") {
        setOtherService(value.servicos_oferecidos_outros || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const isServiceSelected = (serviceId: number) => {
    const currentValues = form.getValues("servicos_oferecidos") || [];
    return currentValues.some(
      (field) => Number(field.domain_tipo_servico) === Number(serviceId)
    );
  };

  const handleServiceToggle = (serviceId: number) => {
    const currentValues = form.getValues("servicos_oferecidos") || [];
    const index = currentValues.findIndex(
      (field) => Number(field.domain_tipo_servico) === Number(serviceId)
    );

    if (index !== -1) {
      const idToRemove = fields.findIndex(
        (f) => Number(f.domain_tipo_servico) === Number(serviceId)
      );
      remove(idToRemove);
    } else {
      append({ domain_tipo_servico: serviceId });
    }
  };

  if (isLoadingServices) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h3 className="font-medium mb-4 text-sm md:text-base">
          Serviços prestados aos utentes e as actividades desenvolvidas pela valência
        </h3>
        <p className="text-xs md:text-sm text-gray-600 mb-4">
          (Seleciona as opções que se aplicam)
        </p>

        {serviceTypes && serviceTypes.length > 0 ? (
          <>
            <div className="block md:hidden space-y-3">
              {serviceTypes.map((service) => (
                <div
                  key={service.id}
                  className="bg-white p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex-1 pr-3">
                      {service.domain_description}
                    </Label>
                    <input
                      type="checkbox"
                      checked={isServiceSelected(Number(service.id))}
                      onChange={() => handleServiceToggle(Number(service.id))}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                    />
                  </div>
                </div>
              ))}

              {/* Mobile Other Service */}
              <div className="bg-white p-3 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Outro (ESPECIFIQUE):
                    </Label>
                    <input
                      type="checkbox"
                      checked={!!otherService}
                      disabled
                      className="h-4 w-4 text-blue-600 rounded shrink-0"
                    />
                  </div>
                  <Input
                    className="w-full"
                    value={otherService}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOtherService(value);
                      form.setValue("servicos_oferecidos_outros", value);
                    }}
                    placeholder="Especifique outro serviço..."
                  />
                </div>
              </div>
            </div>

            {/* Tablet/Desktop Layout */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">SERVIÇO</TableHead>
                    <TableHead className="w-20 text-center">
                      SELECIONADO
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceTypes.map((service) => (
                    <TableRow key={service.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {service.domain_description}
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isServiceSelected(Number(service.id))}
                          onChange={() =>
                            handleServiceToggle(Number(service.id))
                          }
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="flex flex-col lg:flex-row lg:items-center gap-2">
                      <span className="text-sm font-medium whitespace-nowrap">
                        Outro (ESPECIFIQUE):
                      </span>
                      <Input
                        className="w-full max-w-sm"
                        value={otherService}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOtherService(value);
                          form.setValue("servicos_oferecidos_outros", value);
                        }}
                        placeholder="Especifique outro serviço..."
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={!!otherService}
                        disabled
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="p-4 bg-white rounded-lg border text-center">
            <p className="text-sm text-gray-500">
              Nenhum serviço disponível. Verifique se o domínio SERV_PRESTADOS
              está configurado corretamente.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <InfoIcon className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs md:text-sm text-amber-800">
            <strong>Nota:</strong> Selecione os serviços que são prestados pelo
            equipamento. Para especificar um serviço que não está na lista,
            utilize o campo &quot;Outro&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
