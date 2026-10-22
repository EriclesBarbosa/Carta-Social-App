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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EquipmentFormValues } from "@/lib/schemas/equipament-schema";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import dynamic from "next/dynamic";

const LocationPickerModal = dynamic(() => import("@/components/location-picker-modal").then(mod => mod.LocationPickerModal), {
  ssr: false,
});

interface ConstructionInfoFormProps {
  form: UseFormReturn<EquipmentFormValues>;
}

export function ConstructionInfoForm({ form }: ConstructionInfoFormProps) {
  const {
    getBuildingTypeDomain,
    getPropertyRegimeDomain,
    getConservationStateDomain,
  } = useEquipmentHooks();

  const { data: buildingTypes, isLoading: isLoadingBuildingTypes } = getBuildingTypeDomain();
  const { data: propertyRegimes, isLoading: isLoadingPropertyRegimes } = getPropertyRegimeDomain();
  const { data: conservationStates, isLoading: isLoadingConservationStates } = getConservationStateDomain();

  const selectedBuildingType = form.watch("domain_tipo_edificacao");
  const selectedPropertyRegime = form.watch("domain_regime_propriedade");

  const isOutroSelecionado = (list: any[], selectedId: number | undefined) => {
    return list?.find(item => item.id === selectedId)?.domain_description === "Outro (ESPECIFIQUE)";
  };

    const isBuildingTypeApartment = buildingTypes?.find(type => 
    type.id === selectedBuildingType && 
    type.domain_description === "Andar/Apartamento"
  );


  useEffect(() => {
    if (isOutroSelecionado(buildingTypes || [], selectedBuildingType)) {
      const value = form.getValues("tipo_edificacao_outro");
      if (!value || value.trim() === "") {
        form.setError("tipo_edificacao_outro", {
          type: "required",
          message: "Este campo é obrigatório quando 'Outro' é selecionado"
        });
      } else {
        form.clearErrors("tipo_edificacao_outro");
      }
    } else {
      form.clearErrors("tipo_edificacao_outro");
    }


    if (isOutroSelecionado(propertyRegimes || [], selectedPropertyRegime)) {
      const value = form.getValues("regime_propriedade_outro");
      if (!value || value.trim() === "") {
        form.setError("regime_propriedade_outro", {
          type: "required",
          message: "Este campo é obrigatório quando 'Outro' é selecionado"
        });
      } else {
        form.clearErrors("regime_propriedade_outro");
      }
    } else {
      form.clearErrors("regime_propriedade_outro");
    }

    if (isBuildingTypeApartment) {
      const value = form.getValues("n_andar");
      if (!value || value.toString().trim() === "") {
        form.setError("n_andar", {
          type: "required",
          message: "Número do andar é obrigatório para Andar/Apartamento"
        });
      } else {
        form.clearErrors("n_andar");
      }
    } else {
      form.clearErrors("n_andar");
      form.setValue("n_andar", undefined); // Limpa o valor quando não aplicável
    }

  }, [selectedBuildingType, selectedPropertyRegime, form, buildingTypes, propertyRegimes, selectedBuildingType, isBuildingTypeApartment]);



  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="domain_tipo_edificacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Edificação <span className="text-red-500">*</span></FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingBuildingTypes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de edifício" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {buildingTypes?.map((type) => (
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

        {isBuildingTypeApartment && (
          <FormField
            control={form.control}
            name="n_andar"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel>Número do Andar <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 1, 2, 3..."
                    type="number"
                    min="1"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="tipo_edificacao_outro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outro Tipo de Edificação (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Especifique outro tipo, se aplicável"
                  value={
                    typeof field.value === "string" || typeof field.value === "number"
                      ? field.value
                      : ""
                  }
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className="w-full"
                  disabled={!isOutroSelecionado(buildingTypes || [], selectedBuildingType)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="domain_regime_propriedade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regime de Propriedade</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingPropertyRegimes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime de propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {propertyRegimes?.map((regime) => (
                    <SelectItem key={regime.id} value={regime.id?.toString() || ""}>
                      {regime.domain_description}
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
          name="regime_propriedade_outro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outro Regime de Propriedade (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Especifique outro regime, se aplicável"
                  {...field}
                  className="w-full"
                  disabled={!isOutroSelecionado(propertyRegimes || [], selectedPropertyRegime)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="domain_estado_conservacao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Como avalia o estado de conservação deste equipamento <span className="text-red-500">*</span></FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              value={field.value?.toString() || ""}
              disabled={isLoadingConservationStates}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado de conservação" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {conservationStates?.map((state) => (
                  <SelectItem key={state.id} value={state.id?.toString() || ""}>
                    {state.domain_description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      

      <div className="p-0 md:p-0 md:p-4 rounded-lg  mb-4">
        <h3 className="font-medium mb-2">Coordenadas Geográficas </h3>

        <LocationPickerModal
          onLocationSelect={(lat, lng) => {
            form.setValue("latitude", lat.toFixed(6));
            form.setValue("longitude", lng.toFixed(6));
          }}
          defaultPosition={
            !!form.getValues("latitude") && !!form.getValues("longitude")
              ? {
                  lat: parseFloat(form.getValues("latitude")?.toString() || "0"),
                  lng: parseFloat(form.getValues("longitude")?.toString() || "0"),
                }
              : undefined
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Latitude" {...field} readOnly className="w-full read-only:cursor-crosshair" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Longitude" {...field} readOnly className="w-full read-only:cursor-crosshair" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="altura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Altura (metros)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Altura"
                    type="number"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    
    </div>
  );
}
