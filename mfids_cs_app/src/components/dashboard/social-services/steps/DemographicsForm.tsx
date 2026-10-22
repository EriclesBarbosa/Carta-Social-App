"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SocialServiceFormValues } from "@/lib/schemas/services-schema";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DemographicTableFormProps {
  form: UseFormReturn<SocialServiceFormValues>;
}

export function DemographicTableForm({ form }: DemographicTableFormProps) {
  const { getServiceTypesDomain, getFaixaEtariaByTipoResposta } = useEquipmentHooks();
  const { data: serviceTypes, isLoading } = getServiceTypesDomain();
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedTipoResposta = useWatch({
    control: form.control,
    name: "codigo_tipo_resposta",
  });

  const { data: faixaEtariaData = [], isLoading: isLoadingFaixaEtaria } = getFaixaEtariaByTipoResposta(selectedTipoResposta);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "demografias",
  });

  const demografias = useWatch({
    control: form.control,
    name: "demografias",
  });

  const validateCapacidadeVsDemografiaCallback = useCallback(() => {
  const demografias = form.getValues("demografias") || [];
  const capacidadeInstalada = form.getValues("capacidade_instalada") || 0;
  
  const totalDemografia = demografias.reduce((sum, item) => {
    const masculino = Number(item?.total_masculino) || 0;
    const feminino = Number(item?.total_feminino) || 0;
    return sum + masculino + feminino;
  }, 0);
  
  if (totalDemografia > capacidadeInstalada && totalDemografia > 0 && capacidadeInstalada > 0) {
    form.setError("capacidade_instalada", {
      type: "validation",
      message: `Capacidade (${capacidadeInstalada}) menor que total de utentes (${totalDemografia})`
    });
  } else {
    form.clearErrors("capacidade_instalada");
  }
}, [form]);

  useEffect(() => {
    if (selectedTipoResposta) {
      setIsInitialized(false);
    }
  }, [selectedTipoResposta]);

  useEffect(() => {
    if (isInitialized || !faixaEtariaData || faixaEtariaData.length === 0) return;

    const initialDemografias = form.getValues("demografias") || [];

    const newFields = faixaEtariaData.map((faixa) => {
      const existing: any = initialDemografias.find(
        (item: any) => item.domain_faixa_etaria === faixa.id
      );

      return {
        domain_faixa_etaria: faixa.id,
        total_masculino: existing?.total_masculino ?? 0,
        total_feminino: existing?.total_feminino ?? 0,
        deficientes_masculino: existing?.deficientes_masculino ?? 0,
        deficientes_feminino: existing?.deficientes_feminino ?? 0,
        id: existing?.id,
      };
    });

    replace(newFields);
    setIsInitialized(true);
  }, [form, faixaEtariaData, replace, isInitialized]);

  const calculateTotals = () => {
    if (!demografias) {
      return {
        totaisMasculino: 0,
        totaisFeminino: 0,
        totaisDeficientesMasculino: 0,
        totaisDeficientesFeminino: 0,
      };
    }

    return {
      totaisMasculino: demografias.reduce(
        (sum, item) => sum + (Number(item.total_masculino) || 0),
        0
      ),
      totaisFeminino: demografias.reduce(
        (sum, item) => sum + (Number(item.total_feminino) || 0),
        0
      ),
      totaisDeficientesMasculino: demografias.reduce(
        (sum, item) => sum + (Number(item.deficientes_masculino) || 0),
        0
      ),
      totaisDeficientesFeminino: demografias.reduce(
        (sum, item) => sum + (Number(item.deficientes_feminino) || 0),
        0
      ),
    };
  };

  const {
    totaisMasculino,
    totaisFeminino,
    totaisDeficientesMasculino,
    totaisDeficientesFeminino,
  } = calculateTotals();

  const totalGeral = totaisMasculino + totaisFeminino;
  const totalDeficientes =
    totaisDeficientesMasculino + totaisDeficientesFeminino;

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={form.control}
        name="codigo_tipo_resposta"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tipo de Resposta Social <span className="text-red-500">*</span>
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de resposta social" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {serviceTypes?.map((type) => (
                  <SelectItem key={type.domain_code} value={type.domain_code as string}>
                    {type.domain_description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedTipoResposta && (
        <div className="">
          <h3 className="font-medium mb-4 text-sm md:text-base">
            Número de utentes inscritos por grupo etário e segundo o sexo
          </h3>

          {isLoadingFaixaEtaria ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : faixaEtariaData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma faixa etária encontrada para este tipo de resposta social.
            </div>
          ) : (
            <>
              {/* Mobile Layout */}
              <div className="block lg:hidden space-y-4">
                {fields.map((field: any, index) => {
                  const rowData =
                    demografias && demografias[index]
                      ? demografias[index]
                      : field;
                  const rowTotalM = Number(rowData.total_masculino) || 0;
                  const rowTotalF = Number(rowData.total_feminino) || 0;
                  const rowDefM = Number(rowData.deficientes_masculino) || 0;
                  const rowDefF = Number(rowData.deficientes_feminino) || 0;

                  const rowTotal = rowTotalM + rowTotalF;
                  const rowDefTotal = rowDefM + rowDefF;

                  return (
                    <div
                      key={field.id}
                      className="bg-white p-3 md:p-4 rounded-lg border"
                    >
                      <div className="mb-3">
                        <h4 className="font-medium text-sm md:text-base text-center">
                          {faixaEtariaData?.find(
                            (faixa: any) => faixa.id === field.domain_faixa_etaria
                          )?.domain_description ?? ""}
                        </h4>
                      </div>

                      {/* Total de utentes */}
                      <div className="mb-4">
                        <div className="text-xs md:text-sm font-medium text-gray-600 mb-2 text-center">
                          Nº total de utentes inscritos
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <FormLabel className="text-xs">Masculino</FormLabel>
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.total_masculino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
  field.onChange(value);
  validateCapacidadeVsDemografiaCallback();
}}
                                      className="text-center h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Feminino</FormLabel>
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.total_feminino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
  field.onChange(value);
  validateCapacidadeVsDemografiaCallback();
}}
                                      className="text-center h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Total</FormLabel>
                            <div className="h-8 bg-gray-50 border rounded flex items-center justify-center text-sm font-medium">
                              {rowTotal}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pessoas com deficiência */}
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-600 mb-2 text-center">
                          Pessoas com deficiência
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <FormLabel className="text-xs">Masculino</FormLabel>
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.deficientes_masculino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? 0
                                            : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                      className="text-center h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Feminino</FormLabel>
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.deficientes_feminino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? 0
                                            : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                      className="text-center h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Total</FormLabel>
                            <div className="h-8 bg-gray-50 border rounded flex items-center justify-center text-sm font-medium">
                              {rowDefTotal}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mobile Totals */}
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border">
                  <h4 className="font-bold text-center mb-3 text-sm md:text-base">
                    Totais Gerais
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2 text-center">
                        Utentes Inscritos
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium">M</div>
                          <div className="bg-white p-1 rounded border">
                            {totaisMasculino}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">F</div>
                          <div className="bg-white p-1 rounded border">
                            {totaisFeminino}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Total</div>
                          <div className="bg-white p-1 rounded border font-bold">
                            {totalGeral}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-2 text-center">
                        Com Deficiência
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium">M</div>
                          <div className="bg-white p-1 rounded border">
                            {totaisDeficientesMasculino}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">F</div>
                          <div className="bg-white p-1 rounded border">
                            {totaisDeficientesFeminino}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Total</div>
                          <div className="bg-white p-1 rounded border font-bold">
                            {totalDeficientes}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop/Tablet Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white">
                      <th className="border border-gray-300 p-2 md:p-3 text-left min-w-[120px]">
                        Grupo etário (anos)
                      </th>
                      <th
                        className="border border-gray-300 p-2 md:p-3 text-center"
                        colSpan={3}
                      >
                        Nº total de utentes inscritos
                      </th>
                      <th
                        className="border border-gray-300 p-2 md:p-3 text-center"
                        colSpan={3}
                      >
                        Pessoas com deficiência
                      </th>
                    </tr>
                    <tr className="bg-white">
                      <th className="border border-gray-300 p-2 md:p-3 text-left"></th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[80px]">
                        Masculino
                      </th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[80px]">
                        Feminino
                      </th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[60px]">
                        Total
                      </th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[80px]">
                        Masculino
                      </th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[80px]">
                        Feminino
                      </th>
                      <th className="border border-gray-300 p-2 md:p-3 text-center min-w-[60px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field: any, index) => {
                      const rowData =
                        demografias && demografias[index]
                          ? demografias[index]
                          : field;
                      const rowTotalM = Number(rowData.total_masculino) || 0;
                      const rowTotalF = Number(rowData.total_feminino) || 0;
                      const rowDefM = Number(rowData.deficientes_masculino) || 0;
                      const rowDefF = Number(rowData.deficientes_feminino) || 0;

                      const rowTotal = rowTotalM + rowTotalF;
                      const rowDefTotal = rowDefM + rowDefF;

                      return (
                        <tr key={field.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 md:p-3 font-medium">
                            {faixaEtariaData?.find(
                              (faixa: any) =>
                                faixa.id === field.domain_faixa_etaria
                            )?.domain_description ?? ""}
                          </td>
                          <td className="border border-gray-300 p-1 md:p-2">
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.total_masculino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                     onChange={(e) => {
  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
  field.onChange(value);
  validateCapacidadeVsDemografiaCallback();
}}
                                      className="w-full border bg-white text-center p-1 h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="border border-gray-300 p-1 md:p-2">
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.total_feminino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                     onChange={(e) => {
  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
  field.onChange(value);
  validateCapacidadeVsDemografiaCallback();
}}
                                      className="w-full border-none bg-white text-center p-1 h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="border border-gray-300 p-2 md:p-3 text-center bg-gray-50 font-medium">
                            {rowTotal}
                          </td>
                          <td className="border border-gray-300 p-1 md:p-2">
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.deficientes_masculino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? 0
                                            : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                      className="w-full border-none bg-white text-center p-1 h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="border border-gray-300 p-1 md:p-2">
                            <FormField
                              control={form.control}
                              name={`demografias.${index}.deficientes_feminino`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      {...field}
                                      onChange={(e) => {
                                        const value =
                                          e.target.value === ""
                                            ? 0
                                            : parseInt(e.target.value);
                                        field.onChange(value);
                                      }}
                                      className="w-full border-none bg-white text-center p-1 h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="border border-gray-300 p-2 md:p-3 text-center bg-gray-50 font-medium">
                            {rowDefTotal}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-blue-50 font-bold">
                      <td className="border border-gray-300 p-2 md:p-3">Total</td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totaisMasculino}
                      </td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totaisFeminino}
                      </td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totalGeral}
                      </td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totaisDeficientesMasculino}
                      </td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totaisDeficientesFeminino}
                      </td>
                      <td className="border border-gray-300 p-2 md:p-3 text-center">
                        {totalDeficientes}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <div className="p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs md:text-sm text-amber-800">
          <strong>Importante:</strong> Preencha os dados demográficos para cada
          faixa etária. Se uma faixa etária não tiver utentes, deixe com valor
          0. Os totais são calculados automaticamente.
        </p>
      </div>
    </div>
  );
}