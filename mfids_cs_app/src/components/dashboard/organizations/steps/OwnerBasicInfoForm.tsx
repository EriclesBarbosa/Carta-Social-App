"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { OwnerFormValues } from "@/lib/schemas/organization-schema";

interface OwnerBasicInfoFormProps {
  form: UseFormReturn<OwnerFormValues>;
  isPG: boolean;
  isEditing?: boolean;
}

export function OwnerBasicInfoForm({
  form,
}: OwnerBasicInfoFormProps) {
  const { getLegalNatures } = useOrganizationHooks();
  const { data: legalNatures, isLoading } = getLegalNatures();

  const selectedNaturezaJuridica = form.watch("natureza_juridica");

  const isOutroNaturezaSelecionada = (
    list: any[] | undefined,
    selectedValue: string | undefined
  ) => {
    return (
      list?.some(
        (item) =>
          item.domain_description === selectedValue &&
          item.domain_description.includes("Outro")
      ) || false
    );
  };

  return (
    <div className="space-y-4">
     
      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nome da Entidade proprietária{" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Nome completo sem abreviaturas"
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="nif"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              NIF (Nº de Identificação Fiscal){" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="9 dígitos"
                {...field}
                maxLength={9}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="natureza_juridica"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Natureza Jurídica da Entidade Proprietária{" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza jurídica" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {legalNatures?.map((nature) => (
                  <SelectItem
                    key={nature.id}
                    value={nature.domain_description || ""}
                  >
                    {nature.domain_description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="natureza_juridica_outro"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Outra Natureza Jurídica{" "}
              {isOutroNaturezaSelecionada(
                legalNatures,
                selectedNaturezaJuridica
              ) && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Especifique outra natureza jurídica"
                {...field}
                required={isOutroNaturezaSelecionada(
                  legalNatures,
                  selectedNaturezaJuridica
                )}
                disabled={
                  !isOutroNaturezaSelecionada(
                    legalNatures,
                    selectedNaturezaJuridica
                  )
                }
                className="w-full"
                onBlur={(e) => {
                  field.onBlur();
                  if (
                    isOutroNaturezaSelecionada(
                      legalNatures,
                      selectedNaturezaJuridica
                    ) &&
                    (!e.target.value || e.target.value.trim() === "")
                  ) {
                    form.setError("natureza_juridica_outro", {
                      type: "required",
                      message:
                        "Este campo é obrigatório quando 'Outro' é selecionado",
                    });
                  } else {
                    form.clearErrors("natureza_juridica_outro");
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}