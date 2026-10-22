"use client";

import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { EquipmentFormValues } from "@/lib/schemas/equipament-schema";
import { useEquipmentHooks } from "@/hooks/use-equipament";

interface UtilitiesInfoFormProps {
  form: UseFormReturn<EquipmentFormValues>;
}

export function UtilitiesInfoForm({ form }: UtilitiesInfoFormProps) {
  const {
    getWaterTypeDomain,
    getSanitaryTypeDomain,
    getSewerSystemDomain,
    getHasKitchenDomain,
    getTrashCollectionDomain,
  } = useEquipmentHooks();

  const { data: waterTypes, isLoading: isLoadingWaterTypes } =
    getWaterTypeDomain();
  const { data: sanitaryTypes, isLoading: isLoadingSanitaryTypes } =
    getSanitaryTypeDomain();
  const { data: sewerSystems, isLoading: isLoadingSewerSystems } =
    getSewerSystemDomain();
  const { data: kitchenDomains, isLoading: isLoadingKitchenDomains } =
    getHasKitchenDomain();
  const { data: trashCollectionSystems, isLoading: isLoadingTrashSystems } =
    getTrashCollectionDomain();

  const selectedTrashCollection = form.watch("domain_colecta_lixo");

  const isOutroColetaSelecionado = (
    list: any[],
    selectedId: number | undefined
  ) => {
    return (
      list?.find((item) => item.id === selectedId)?.domain_description ===
      "Outro (ESPECIFIQUE)"
    );
  };

  useEffect(() => {
    if (
      isOutroColetaSelecionado(
        trashCollectionSystems || [],
        selectedTrashCollection
      )
    ) {
      const value = form.getValues("colecta_lixo_outro");
      if (!value || value.trim() === "") {
        form.setError("colecta_lixo_outro", {
          type: "required",
          message: "Este campo é obrigatório quando 'Outro' é selecionado",
        });
      } else {
        form.clearErrors("colecta_lixo_outro");
      }
    } else {
      form.clearErrors("colecta_lixo_outro");
    }
  }, [selectedTrashCollection]);

  return (
    <div className="space-y-4">
      <div className="p-0 md:p-0 md:p-4 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">Energia e Água</h3>

        <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
          <FormField
            control={form.control}
            name="possui_eletricidade"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    O equipamento tem eletricidade?
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="domain_ligacao_rede_publica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                O equipamento tem ligação à rede pública da distribuição de água
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingWaterTypes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de água canalizada" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {waterTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id?.toString() || ""}>
                      {type.domain_description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="p-0 md:p-0 md:p-4 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">Saneamento</h3>

        <FormField
          control={form.control}
          name="domain_sanita_latrina"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>O equipamento tem sanita ou latrina?</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingSanitaryTypes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de sanitário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sanitaryTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id?.toString() || ""}>
                      {type.domain_description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
          <FormField
            control={form.control}
            name="banheiro_poliban"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    O equipamento tem banheira ou poliban com chuveiro?
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="domain_evacuacao_agua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                O equipamento tem sistema de evacuação das águas residuais?
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingSewerSystems}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sistema de esgoto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sewerSystems?.map((system) => (
                    <SelectItem
                      key={system.id}
                      value={system.id?.toString() || ""}
                    >
                      {system.domain_description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="p-0 md:p-0 md:p-4 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">
          Outros Utilitários
        </h3>

        <FormField
          control={form.control}
          name="domain_possui_cozinha"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Se o equipamento tem cozinha</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingKitchenDomains}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a opção de cozinha" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {kitchenDomains?.map((option) => (
                    <SelectItem
                      key={option.id}
                      value={option.id?.toString() || ""}
                    >
                      {option.domain_description}
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
          name="domain_colecta_lixo"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="flex items-center">
                O lixo deste equipamento é
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingTrashSystems}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sistema de coleta de lixo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trashCollectionSystems?.map((system) => (
                    <SelectItem
                      key={system.id}
                      value={system.id?.toString() || ""}
                    >
                      {system.domain_description}
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
          name="colecta_lixo_outro"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>O lixo deste equipamento é (Outro)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Especifique outro sistema, se aplicável"
                  {...field}
                  className="w-full"
                  disabled={
                    !isOutroColetaSelecionado(
                      trashCollectionSystems || [],
                      selectedTrashCollection
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <FormField
            control={form.control}
            name="acesso_a_deficiente"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <FormLabel className="text-base">
                      O equipamento está preparado para acesso a pessoas com
                      deficiência?
                    </FormLabel>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    (rampas de acesso, casas de banho adaptadas, sinalética
                    adequada, etc.)
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Importante:</strong> Certifique-se de preencher corretamente
          as informações sobre os utilitários do equipamento, pois elas são
          essenciais para avaliar a qualidade da infraestrutura e a
          acessibilidade do espaço.
        </p>
      </div>
    </div>
  );
}
