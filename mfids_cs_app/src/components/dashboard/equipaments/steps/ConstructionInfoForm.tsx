"use client";

import React, { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const LocationPickerModal = dynamic(() => import("@/components/location-picker-modal").then(mod => mod.LocationPickerModal), {
  ssr: false,
});

interface ConstructionInfoFormProps {
  form: UseFormReturn<EquipmentFormValues>;
}

type GpsStatus = "idle" | "loading" | "success" | "error";

export function ConstructionInfoForm({ form }: ConstructionInfoFormProps) {
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("GPS não suportado neste browser.");
      return;
    }
    setGpsStatus("loading");
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude.toFixed(6));
        form.setValue("longitude", pos.coords.longitude.toFixed(6));
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus("success");
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(
          err.code === 1
            ? "Permissão de localização negada. Activa o GPS nas definições do browser."
            : "Não foi possível obter a localização. Tenta novamente."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

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

      

      <div className="p-4 border rounded-lg bg-muted/30 mb-4">
        <h3 className="font-medium mb-3">Coordenadas Geográficas</h3>

        {/* Botão de toque único — ideal para uso no telemóvel em campo */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button
            type="button"
            onClick={captureGps}
            disabled={gpsStatus === "loading"}
            className="w-full sm:w-auto flex items-center gap-2 text-base h-12"
          >
            {gpsStatus === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            {gpsStatus === "loading" ? "A obter localização GPS..." : "Capturar GPS"}
          </Button>

          <LocationPickerModal
            onLocationSelect={(lat, lng) => {
              form.setValue("latitude", lat.toFixed(6));
              form.setValue("longitude", lng.toFixed(6));
              setGpsStatus("success");
              setGpsAccuracy(null);
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
        </div>

        {/* Feedback de estado do GPS */}
        {gpsStatus === "success" && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Localização capturada
              {gpsAccuracy !== null && (
                <span className="ml-1 font-medium">
                  — precisão ±{gpsAccuracy}m
                  {gpsAccuracy <= 10 && " (Excelente)"}
                  {gpsAccuracy > 10 && gpsAccuracy <= 30 && " (Boa)"}
                  {gpsAccuracy > 30 && " (Regular — aguarda ou ajusta no mapa)"}
                </span>
              )}
            </span>
          </div>
        )}
        {gpsStatus === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
