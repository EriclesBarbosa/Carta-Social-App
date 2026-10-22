"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";

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
import { EquipmentFormValues } from "@/lib/schemas/equipament-schema";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FinancingInfoFormProps {
  form: UseFormReturn<EquipmentFormValues>;
}

export function FinancingInfoForm({ form }: FinancingInfoFormProps) {
  const {
    getFinancingSourceDomain,
    getRemodelingSourceDomain,
    getConstructionTypeDomain,
  } = useEquipmentHooks();
  const { data: financingSources } = getFinancingSourceDomain();
  const { data: remodelingFinancingSources } = getRemodelingSourceDomain();

  const [otherFinancingSource, setOtherFinancingSource] = useState(
    form.getValues().fonte_financiamento_outro || ""
  );
  const [otherRemodelingSource, setOtherRemodelingSource] = useState(
    form.getValues().fonte_fin_remodelacao_outro || ""
  );

  const {
    fields: financingFields,
    append: appendFinancing,
    remove: removeFinancing,
  } = useFieldArray({
    control: form.control,
    name: "fontes_financiamento",
    keyName: "formId",
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "fonte_financiamento_outro") {
        setOtherFinancingSource(value.fonte_financiamento_outro || "");
      }
      if (name === "fonte_fin_remodelacao_outro") {
        setOtherRemodelingSource(value.fonte_fin_remodelacao_outro || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (otherFinancingSource) {
      form.setValue("fonte_financiamento_outro", otherFinancingSource);

      const exists = financingFields.some(
        (field) =>
          field.domain_fonte_fin === 99 && field.contexto === "construção"
      );

      if (!exists) {
        appendFinancing({
          fonte: "1",
          contexto: "construção",
          domain_fonte_fin: 99,
        });
      }
    }
  }, [otherFinancingSource, form, financingFields, appendFinancing]);

  useEffect(() => {
    if (otherRemodelingSource) {
      form.setValue("fonte_fin_remodelacao_outro", otherRemodelingSource);

      const exists = financingFields.some(
        (field) =>
          field.domain_fonte_fin === 999 && field.contexto === "remodelação"
      );

      if (!exists) {
        appendFinancing({
          fonte: "1",
          contexto: "remodelação",
          domain_fonte_fin: 999,
        });
      }
    }
  }, [otherRemodelingSource, form, financingFields, appendFinancing]);

  const handleSourceSelection = (
    sourceId: number,
    context: string,
    option: "1" | "2" | null
  ) => {
    const index = financingFields.findIndex(
      (field) =>
        field.domain_fonte_fin === sourceId && field.contexto === context
    );

    if (index !== -1) {
      removeFinancing(index);
    }

    if (option !== null) {
      appendFinancing({
        fonte: option,
        contexto: context,
        domain_fonte_fin: sourceId,
      });
    }
  };

  // Nova função para limpar seleção específica
  const handleClearSpecificSelection = (sourceId: number, context: string) => {
    const index = financingFields.findIndex(
      (field) =>
        field.domain_fonte_fin === sourceId && field.contexto === context
    );

    if (index !== -1) {
      removeFinancing(index);
    }

    // Se for o campo "Outro", limpar também o input de texto
    if (sourceId === 99 && context === "construção") {
      setOtherFinancingSource("");
      form.setValue("fonte_financiamento_outro", "");
    }
    
    if (sourceId === 999 && context === "remodelação") {
      setOtherRemodelingSource("");
      form.setValue("fonte_fin_remodelacao_outro", "");
    }
  };

  const isOptionSelected = (
    sourceId: number,
    context: string,
    option: "1" | "2"
  ) => {
    return financingFields.some(
      (field) =>
        field.domain_fonte_fin === sourceId &&
        field.contexto === context &&
        field.fonte === option
    );
  };

  const { data: constructionTypes, isLoading: isLoadingConstructionTypes } =
    getConstructionTypeDomain();

  const selectedConstructionType = form.watch("domain_tipo_construcao_outro");
  const isOutroSelecionado = (list: any[], selectedId: number | undefined) => {
    return (
      list?.find((item) => item.id === selectedId)?.domain_description ===
      "Outro (ESPECIFIQUE)"
    );
  };

  useEffect(() => {
    if (isOutroSelecionado(constructionTypes || [], selectedConstructionType)) {
      const value = form.getValues("tipo_construcao_outro");
      if (!value || value.trim() === "") {
        form.setError("tipo_construcao_outro", {
          type: "required",
          message: "Este campo é obrigatório quando 'Outro' é selecionado",
        });
      } else {
        form.clearErrors("tipo_construcao_outro");
      }
    } else {
      form.clearErrors("tipo_construcao_outro");
    }
  }, [form, constructionTypes, selectedConstructionType]);

  const handleResetConstructionSelections = () => {
    const indicesToRemove: any = [];
    financingFields.forEach((field, index) => {
      if (field.contexto === "construção") {
        indicesToRemove.push(index);
      }
    });
    
    (indicesToRemove as number[]).reverse().forEach((index: number) => removeFinancing(index));
    
    setOtherFinancingSource("");
    form.setValue("fonte_financiamento_outro", "");
  };

  const handleResetRemodelingSelections = () => {
    const indicesToRemove: any = [];
    financingFields.forEach((field, index) => {
      if (field.contexto === "remodelação") {
        indicesToRemove.push(index);
      }
    });
    
    indicesToRemove.reverse().forEach((index: number) => removeFinancing(index));
    
    setOtherRemodelingSource("");
    form.setValue("fonte_fin_remodelacao_outro", "");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="domain_tipo_construcao_outro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Construção</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={isLoadingConstructionTypes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de construção" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {constructionTypes?.map((type) => (
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

        <FormField
          control={form.control}
          name="tipo_construcao_outro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outro Tipo de Construção</FormLabel>
              <FormControl>
                <Input
                  placeholder="Especifique outro tipo, se aplicável"
                  {...field}
                  className="w-full"
                  disabled={
                    !isOutroSelecionado(
                      constructionTypes || [],
                      selectedConstructionType
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="p-3 md:p-4 bg-gray-50 rounded-lg border mb-4">
        <h3 className="font-medium mb-3 text-sm md:text-base">Remodelação</h3>
        <FormField
          control={form.control}
          name="remodelado"
          render={({ field }) => (
            <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg p-3 bg-white border">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                <FormLabel className="text-sm md:text-base">
                  O equipamento foi remodelado nos últimos 8 anos?
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

      {(form.getValues().domain_tipo_construcao_outro === 133 ||
        form.getValues().domain_tipo_construcao_outro === 132) && (
        <div className="">
          <div className="flex justify-between">
            <h3 className="font-medium mb-4 text-sm md:text-base">
              Fonte de financiamento da construção (Seleciona as opções que se aplicam)
            </h3>
            <button
              type="button"
              onClick={handleResetConstructionSelections}
              className="px-3 py-1.5 text-xs md:text-sm bg-red-50 hover:bg-red-100 
                   text-red-700 rounded-md border border-red-200 transition-colors"
            >
              Limpar todas
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="block md:hidden space-y-3">
            {financingSources?.map((source) => (
              <div key={source.id} className="bg-white p-3 rounded-lg border">
                <div className="mb-2">
                  <span className="text-sm font-medium">
                    {source.domain_description}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`source-yes-mobile-construcao-${source.id}`}
                      name={`source-mobile-construcao-${source.id}`}
                      checked={isOptionSelected(
                        Number(source.id),
                        "construção",
                        "1"
                      )}
                      onChange={() =>
                        handleSourceSelection(
                          Number(source.id),
                          "construção",
                          "1"
                        )
                      }
                      className="mr-2"
                    />
                    <Label
                      htmlFor={`source-yes-mobile-construcao-${source.id}`}
                      className="text-sm"
                    >
                      SIM
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`source-no-mobile-construcao-${source.id}`}
                      name={`source-mobile-construcao-${source.id}`}
                      checked={isOptionSelected(
                        Number(source.id),
                        "construção",
                        "2"
                      )}
                      onChange={() =>
                        handleSourceSelection(
                          Number(source.id),
                          "construção",
                          "2"
                        )
                      }
                      className="mr-2"
                    />
                    <Label
                      htmlFor={`source-no-mobile-construcao-${source.id}`}
                      className="text-sm"
                    >
                      NÃO
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificSelection(Number(source.id), "construção")}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                               text-gray-700 rounded border transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white p-3 rounded-lg border">
              <div className="mb-2">
                <span className="text-sm font-medium">
                  99. Outro (ESPECIFIQUE):
                </span>
              </div>
              <Input
                className="mb-3"
                value={otherFinancingSource}
                onChange={(e) => setOtherFinancingSource(e.target.value)}
                placeholder="Especifique outro..."
              />
              <div className="flex gap-4 items-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="source-other-yes-mobile-construcao"
                    name="source-other-mobile-construcao"
                    checked={!!otherFinancingSource}
                    disabled={true}
                    className="mr-2"
                  />
                  <Label
                    htmlFor="source-other-yes-mobile-construcao"
                    className="text-sm"
                  >
                    SIM
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="source-other-no-mobile-construcao"
                    name="source-other-mobile-construcao"
                    checked={false}
                    disabled={true}
                    className="mr-2"
                  />
                  <Label
                    htmlFor="source-other-no-mobile-construcao"
                    className="text-sm"
                  >
                    NÃO
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearSpecificSelection(99, "construção")}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                             text-gray-700 rounded border transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">FONTE</TableHead>
                  <TableHead className="w-20 text-center">SIM</TableHead>
                  <TableHead className="w-20 text-center">NÃO</TableHead>
                  <TableHead className="w-20 text-center">LIMPAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financingSources?.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="text-sm">
                      {source.domain_description}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`source-yes-desktop-construcao-${source.id}`}
                          name={`source-desktop-construcao-${source.id}`}
                          checked={isOptionSelected(
                            Number(source.id),
                            "construção",
                            "1"
                          )}
                          onChange={() =>
                            handleSourceSelection(
                              Number(source.id),
                              "construção",
                              "1"
                            )
                          }
                          className="mr-1.5"
                        />
                        <Label
                          htmlFor={`source-yes-desktop-construcao-${source.id}`}
                        >
                          1
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`source-no-desktop-construcao-${source.id}`}
                          name={`source-desktop-construcao-${source.id}`}
                          checked={isOptionSelected(
                            Number(source.id),
                            "construção",
                            "2"
                          )}
                          onChange={() =>
                            handleSourceSelection(
                              Number(source.id),
                              "construção",
                              "2"
                            )
                          }
                          className="mr-1.5"
                        />
                        <Label
                          htmlFor={`source-no-desktop-construcao-${source.id}`}
                        >
                          2
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleClearSpecificSelection(Number(source.id), "construção")}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                                   text-gray-700 rounded border transition-colors"
                      >
                        ✕
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <span className="text-sm whitespace-nowrap">
                      99. Outro (ESPECIFIQUE):
                    </span>
                    <Input
                      className="w-full max-w-xs"
                      value={otherFinancingSource}
                      onChange={(e) => setOtherFinancingSource(e.target.value)}
                      placeholder="Especifique outro..."
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        id="source-other-yes-desktop-construcao"
                        name="source-other-desktop-construcao"
                        checked={!!otherFinancingSource}
                        disabled={true}
                        className="mr-1.5"
                      />
                      <Label htmlFor="source-other-yes-desktop-construcao">
                        1
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        id="source-other-no-desktop-construcao"
                        name="source-other-desktop-construcao"
                        checked={false}
                        disabled={true}
                        className="mr-1.5"
                      />
                      <Label htmlFor="source-other-no-desktop-construcao">
                        2
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleClearSpecificSelection(99, "construção")}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                                 text-gray-700 rounded border transition-colors"
                    >
                      ✕
                    </button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {form.getValues().remodelado === true && (
        <div className="">
          <div className="flex items-center justify-between">
            <h3 className="font-medium mb-4 text-sm md:text-base">
              Fonte de financiamento da última remodelação (Seleciona as opções que se aplicam)
            </h3>
            <button
              type="button"
              onClick={handleResetRemodelingSelections}
              className="px-3 py-1.5 text-xs md:text-sm bg-red-50 hover:bg-red-100 
                   text-red-700 rounded-md border border-red-200 transition-colors"
            >
              Limpar todas
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="block md:hidden space-y-3">
            {remodelingFinancingSources?.map((source) => (
              <div key={source.id} className="bg-white p-3 rounded-lg border">
                <div className="mb-2">
                  <span className="text-sm font-medium">
                    {source.domain_description}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`remodel-yes-mobile-${source.id}`}
                      name={`remodel-mobile-${source.id}`}
                      checked={isOptionSelected(
                        Number(source.id),
                        "remodelação",
                        "1"
                      )}
                      onChange={() =>
                        handleSourceSelection(
                          Number(source.id),
                          "remodelação",
                          "1"
                        )
                      }
                      className="mr-2"
                    />
                    <Label
                      htmlFor={`remodel-yes-mobile-${source.id}`}
                      className="text-sm"
                    >
                      SIM
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`remodel-no-mobile-${source.id}`}
                      name={`remodel-mobile-${source.id}`}
                      checked={isOptionSelected(
                        Number(source.id),
                        "remodelação",
                        "2"
                      )}
                      onChange={() =>
                        handleSourceSelection(
                          Number(source.id),
                          "remodelação",
                          "2"
                        )
                      }
                      className="mr-2"
                    />
                    <Label
                      htmlFor={`remodel-no-mobile-${source.id}`}
                      className="text-sm"
                    >
                      NÃO
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificSelection(Number(source.id), "remodelação")}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                               text-gray-700 rounded border transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white p-3 rounded-lg border">
              <div className="mb-2">
                <span className="text-sm font-medium">
                  99. Outro (ESPECIFIQUE):
                </span>
              </div>
              <Input
                className="mb-3"
                value={otherRemodelingSource}
                onChange={(e) => setOtherRemodelingSource(e.target.value)}
                placeholder="Especifique outro..."
              />
              <div className="flex gap-4 items-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="remodel-other-yes-mobile"
                    name="remodel-other-mobile"
                    checked={!!otherRemodelingSource}
                    disabled={true}
                    className="mr-2"
                  />
                  <Label htmlFor="remodel-other-yes-mobile" className="text-sm">
                    SIM
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="remodel-other-no-mobile"
                    name="remodel-other-mobile"
                    checked={false}
                    disabled={true}
                    className="mr-2"
                  />
                  <Label htmlFor="remodel-other-no-mobile" className="text-sm">
                    NÃO
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearSpecificSelection(999, "remodelação")}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                             text-gray-700 rounded border transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">FONTE</TableHead>
                  <TableHead className="w-20 text-center">SIM</TableHead>
                  <TableHead className="w-20 text-center">NÃO</TableHead>
                  <TableHead className="w-20 text-center">LIMPAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remodelingFinancingSources?.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="text-sm">
                      {source.domain_description}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`remodel-yes-desktop-${source.id}`}
                          name={`remodel-desktop-${source.id}`}
                          checked={isOptionSelected(
                            Number(source.id),
                            "remodelação",
                            "1"
                          )}
                          onChange={() =>
                            handleSourceSelection(
                              Number(source.id),
                              "remodelação",
                              "1"
                            )
                          }
                          className="mr-1.5"
                        />
                        <Label htmlFor={`remodel-yes-desktop-${source.id}`}>
                          1
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id={`remodel-no-desktop-${source.id}`}
                          name={`remodel-desktop-${source.id}`}
                          checked={isOptionSelected(
                            Number(source.id),
                            "remodelação",
                            "2"
                          )}
                          onChange={() =>
                            handleSourceSelection(
                              Number(source.id),
                              "remodelação",
                              "2"
                            )
                          }
                          className="mr-1.5"
                        />
                        <Label htmlFor={`remodel-no-desktop-${source.id}`}>
                          2
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleClearSpecificSelection(Number(source.id), "remodelação")}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                                   text-gray-700 rounded border transition-colors"
                      >
                        ✕
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <span className="text-sm whitespace-nowrap">
                      99. Outro (ESPECIFIQUE):
                    </span>
                    <Input
                      className="w-full max-w-xs"
                      value={otherRemodelingSource}
                      onChange={(e) => setOtherRemodelingSource(e.target.value)}
                      placeholder="Especifique outro..."
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        id="remodel-other-yes-desktop"
                        name="remodel-other-desktop"
                        checked={!!otherRemodelingSource}
                        disabled={true}
                        className="mr-1.5"
                      />
                      <Label htmlFor="remodel-other-yes-desktop">1</Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <input
                        type="radio"
                        id="remodel-other-no-desktop"
                        name="remodel-other-desktop"
                        checked={false}
                        disabled={true}
                        className="mr-1.5"
                      />
                      <Label htmlFor="remodel-other-no-desktop">2</Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleClearSpecificSelection(999, "remodelação")}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                                 text-gray-700 rounded border transition-colors"
                    >
                      ✕
                    </button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {form?.getValues()?.remodelado === false &&
        (form.getValues().domain_tipo_construcao_outro !== 132 ||
          form.getValues().domain_tipo_construcao_outro !== 133) && (
          <div className="p-3 md:p-4 bg-gray-100 rounded-lg border">
            <span className="text-sm md:text-base text-gray-600">
              Opções indisponíveis de acordo com as opções selecionadas
              construção e remodelação
            </span>
          </div>
        )}
    </div>
  );
}