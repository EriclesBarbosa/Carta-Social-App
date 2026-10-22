"use client";

import React, { useEffect, useMemo } from "react";
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
import { useGeographic } from "@/hooks/use-geographic";
import {
  ManagerFormValues,
  OwnerFormValues,
} from "@/lib/schemas/organization-schema";

interface GeographicInfoFormProps {
  form: UseFormReturn<OwnerFormValues | ManagerFormValues>;
  initialValues?: {
    ilha?: string;
    concelho?: string;
    freguesia?: string;
    zona?: string;
    lugar?: string;
  };
}

export function GeographicInfoForm({
  form,
  initialValues,
}: GeographicInfoFormProps) {
  const { islands, useGetCounties, useGetParishes, useGetZones, useGetLugar } =
    useGeographic();

  const ilha = form.watch("geografia.ilha");
  const concelho = form.watch("geografia.concelho");
  const freguesia = form.watch("geografia.freguesia");
  const zona = form.watch("geografia.zona");

  const { data: counties, isLoading: isLoadingCounties } = useGetCounties(
    ilha || initialValues?.ilha
  );
  const { data: parishes, isLoading: isLoadingParishes } = useGetParishes(
    concelho || initialValues?.concelho
  );
  const { data: zones, isLoading: isLoadingZones } = useGetZones(
    freguesia || initialValues?.freguesia
  );
  const { data: lugares, isLoading: isLoadingLugares } = useGetLugar(
    zona || initialValues?.zona
  );

  const groupedZones = useMemo(() => {
    if (!zones) return [];

    const groups = new Map();
    zones.forEach((zone: any) => {
      if (zone.zona && zone.zona.trim()) {
        if (!groups.has(zone.zona)) {
          groups.set(zone.zona, zone);
        }
      }
    });

    return Array.from(groups.values());
  }, [zones]);

  useEffect(() => {
    if (initialValues?.ilha && !ilha && (islands.data?.length ?? 0) > 0) {
      form.setValue("geografia.ilha", initialValues.ilha);
    }
  }, [initialValues?.ilha, ilha, islands.data, form]);

  useEffect(() => {
    if (initialValues?.concelho && !concelho && (counties?.length ?? 0) > 0) {
      form.setValue("geografia.concelho", initialValues.concelho);
    }
  }, [initialValues?.concelho, concelho, counties, form]);

  useEffect(() => {
    if (
      initialValues?.freguesia &&
      !freguesia &&
      parishes &&
      parishes.length > 0
    ) {
      form.setValue("geografia.freguesia", initialValues.freguesia);
    }
  }, [initialValues?.freguesia, freguesia, parishes, form]);

  useEffect(() => {
    if (
      initialValues?.zona &&
      !form.watch("geografia.zona") &&
      (zones?.length ?? 0) > 0
    ) {
      form.setValue("geografia.zona", initialValues.zona);
    }
  }, [initialValues?.zona, zones, form]);

  useEffect(() => {
    if (
      initialValues?.lugar &&
      !form.watch("geografia.lugar") &&
      (lugares?.length ?? 0) > 0
    ) {
      form.setValue("geografia.lugar", initialValues.lugar);
    }
  }, [initialValues?.lugar, lugares, form]);

  useEffect(() => {
    if (ilha && ilha !== initialValues?.ilha) {
      form.setValue("geografia.concelho", "");
      form.setValue("geografia.freguesia", "");
      form.setValue("geografia.zona", "");
      form.setValue("geografia.lugar", "");
    }
  }, [ilha, initialValues?.ilha, form]);

  useEffect(() => {
    if (concelho && concelho !== initialValues?.concelho) {
      form.setValue("geografia.freguesia", "");
      form.setValue("geografia.zona", "");
      form.setValue("geografia.lugar", "");
    }
  }, [concelho, initialValues?.concelho, form]);

  useEffect(() => {
    if (freguesia && freguesia !== initialValues?.freguesia) {
      form.setValue("geografia.zona", "");
      form.setValue("geografia.lugar", "");
    }
  }, [freguesia, initialValues?.freguesia, form]);

  useEffect(() => {
    if (zona && zona !== initialValues?.zona) {
      form.setValue("geografia.lugar", "");
    }
  }, [zona, initialValues?.zona, form]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="geografia.ilha"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Ilha <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (value !== initialValues?.ilha) {
                  form.setValue("geografia.concelho", "");
                  form.setValue("geografia.freguesia", "");
                  form.setValue("geografia.zona", "");
                  form.setValue("geografia.lugar", "");
                }
              }}
              value={field.value}
              disabled={islands.isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ilha" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {islands.data?.map((island: any) => (
                  <SelectItem
                    key={`${island.ilha || island.nome}-${Math.random()}`}
                    value={island.ilha || ""}
                  >
                    {island.ilha || island.nome}
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
        name="geografia.concelho"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Concelho <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (value !== initialValues?.concelho) {
                  form.setValue("geografia.freguesia", "");
                  form.setValue("geografia.zona", "");
                  form.setValue("geografia.lugar", "");
                }
              }}
              value={field.value}
              disabled={isLoadingCounties || !ilha}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o concelho" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {counties?.map((county: any) => (
                  <SelectItem
                    key={`${county?.concelho || county?.nome}-${Math.random()}`}
                    value={county?.concelho || ""}
                  >
                    {county?.concelho || county?.nome}
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
        name="geografia.freguesia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Freguesia <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (value !== initialValues?.freguesia) {
                  form.setValue("geografia.zona", "");
                  form.setValue("geografia.lugar", "");
                }
              }}
              value={field.value}
              disabled={isLoadingParishes || !concelho}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a freguesia" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {parishes?.map((parish: any) => (
                  <SelectItem
                    key={`${parish.freguesia || parish?.nome}-${Math.random()}`}
                    value={parish.freguesia || ""}
                  >
                    {parish.freguesia || parish.nome}
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
        name="geografia.zona"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Zona  <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (value !== initialValues?.zona) {
                  form.setValue("geografia.lugar", "");
                }
              }}
              value={field.value || ""}
              disabled={isLoadingZones || !freguesia}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a zona" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {groupedZones.map((zone: any) => (
                  <SelectItem key={zone.id} value={zone.zona}>
                    {zone.zona}
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
        name="geografia.lugar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Localidade <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                const selectedLugar = lugares?.find(
                  (lugar: any) => lugar.lugar === value
                );
                if (selectedLugar) {
                  form.setValue("geografia", {
                    ilha: form.getValues("geografia.ilha"),
                    concelho: form.getValues("geografia.concelho"),
                    freguesia: form.getValues("geografia.freguesia"),
                    zona: form.getValues("geografia.zona"),
                    lugar: value,
                    id: selectedLugar.id.toString(),
                  });
                }
              }}
              value={field.value || ""}
              disabled={isLoadingLugares || !zona}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lugar" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {lugares?.map((lugar: any) => (
                  <SelectItem key={lugar.id} value={lugar.lugar}>
                    {lugar.lugar || lugar.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}