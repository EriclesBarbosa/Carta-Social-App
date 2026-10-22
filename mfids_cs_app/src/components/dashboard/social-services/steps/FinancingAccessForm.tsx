"use client";

import React, { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";

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

interface FinancingAccessFormProps {
  form: UseFormReturn<SocialServiceFormValues>;
}

export function FinancingAccessForm({ form }: FinancingAccessFormProps) {
  const { getServiceFinancingDomain } = useEquipmentHooks();
  const { data: financingSources, isLoading: isLoadingFinancing } =
    getServiceFinancingDomain();
  const [otherFinancingSource, setOtherFinancingSource] = useState(
    form.getValues().domain_fonte_fin_outros || ""
  ) as any;

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "fontes_financiamento",
    keyName: "formId",
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "domain_fonte_fin_outros") {
        setOtherFinancingSource(value.domain_fonte_fin_outros || "");
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (otherFinancingSource) {
      form.setValue("domain_fonte_fin_outros", otherFinancingSource);

      const exists = fields.some(
        (field) =>
          field.domain_fonte_fin === 99 && field.contexto === "FUNCIONAMENTO"
      );

      if (!exists) {
        append({
          fonte: "1",
          contexto: "FUNCIONAMENTO",
          domain_fonte_fin: 99,
        });
      }
    }
  }, [otherFinancingSource, form, fields, append]);

  const handleSourceSelection = (
    sourceId: number,
    option: "1" | "2" | null
  ) => {
    const index = fields.findIndex(
      (field) =>
        field.domain_fonte_fin === sourceId &&
        field.contexto === "FUNCIONAMENTO"
    );

    if (index !== -1) {
      if (option === null) {
        remove(index);
      } else {
        update(index, {
          ...fields[index],
          fonte: option,
          contexto: "FUNCIONAMENTO",
          domain_fonte_fin: sourceId,
        });
      }
    } else if (option !== null) {
      append({
        fonte: option,
        contexto: "FUNCIONAMENTO",
        domain_fonte_fin: sourceId,
      });
    }
  };

  // Nova função para limpar seleção específica
  const handleClearSpecificSelection = (sourceId: number) => {
    const index = fields.findIndex(
      (field) =>
        field.domain_fonte_fin === sourceId &&
        field.contexto === "FUNCIONAMENTO"
    );

    if (index !== -1) {
      remove(index);
    }

    // Se for o campo "Outro", limpar também o input de texto
    if (sourceId === 99) {
      setOtherFinancingSource("");
      form.setValue("domain_fonte_fin_outros", undefined);
    }
  };

  const isOptionSelected = (sourceId: number, option: "1" | "2") => {
    return fields.some(
      (field) =>
        field.domain_fonte_fin === sourceId &&
        field.contexto === "FUNCIONAMENTO" &&
        field.fonte === option
    );
  };

  const handleResetSelections = () => {
    remove();
    setOtherFinancingSource("");
    form.setValue("domain_fonte_fin_outros", undefined);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="">
        <div className="flex justify-between mb-10">
          <div>
            <h3 className="font-medium text-sm md:text-base">
              Fontes de financiamento para funcionamento
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mb-4">
              (Seleciona as opções que se aplicam)
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetSelections}
            className="px-3 py-1.5 text-xs md:text-sm bg-red-50 hover:bg-red-100 
                 text-red-700 rounded-md border border-red-200 transition-colors"
          >
            Limpar todas
          </button>
        </div>

        {isLoadingFinancing ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : financingSources && financingSources.length > 0 ? (
          <>
            {/* Mobile Layout */}
            <div className="block md:hidden space-y-3">
              {financingSources.map((source) => (
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
                        id={`source-yes-mobile-${source.id}`}
                        name={`source-mobile-${source.id}`}
                        checked={isOptionSelected(Number(source.id), "1")}
                        onChange={() =>
                          handleSourceSelection(Number(source.id), "1")
                        }
                        className="mr-2"
                      />
                      <Label
                        htmlFor={`source-yes-mobile-${source.id}`}
                        className="text-sm"
                      >
                        SIM
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`source-no-mobile-${source.id}`}
                        name={`source-mobile-${source.id}`}
                        checked={isOptionSelected(Number(source.id), "2")}
                        onChange={() =>
                          handleSourceSelection(Number(source.id), "2")
                        }
                        className="mr-2"
                      />
                      <Label
                        htmlFor={`source-no-mobile-${source.id}`}
                        className="text-sm"
                      >
                        NÃO
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClearSpecificSelection(Number(source.id))}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 
                                 text-gray-700 rounded border transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              ))}

              {/* Mobile Other Source */}
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
                      id="source-other-yes-mobile"
                      name="source-other-mobile"
                      checked={!!otherFinancingSource}
                      disabled={true}
                      className="mr-2"
                    />
                    <Label
                      htmlFor="source-other-yes-mobile"
                      className="text-sm"
                    >
                      SIM
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="source-other-no-mobile"
                      name="source-other-mobile"
                      checked={false}
                      disabled={true}
                      className="mr-2"
                    />
                    <Label htmlFor="source-other-no-mobile" className="text-sm">
                      NÃO
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificSelection(99)}
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
                  {financingSources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="text-sm">
                        {source.domain_description}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <input
                            type="radio"
                            id={`source-yes-desktop-${source.id}`}
                            name={`source-desktop-${source.id}`}
                            checked={isOptionSelected(Number(source.id), "1")}
                            onChange={() =>
                              handleSourceSelection(Number(source.id), "1")
                            }
                            className="mr-1.5"
                          />
                          <Label htmlFor={`source-yes-desktop-${source.id}`}>
                            1
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <input
                            type="radio"
                            id={`source-no-desktop-${source.id}`}
                            name={`source-desktop-${source.id}`}
                            checked={isOptionSelected(Number(source.id), "2")}
                            onChange={() =>
                              handleSourceSelection(Number(source.id), "2")
                            }
                            className="mr-1.5"
                          />
                          <Label htmlFor={`source-no-desktop-${source.id}`}>
                            2
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleClearSpecificSelection(Number(source.id))}
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
                        onChange={(e) =>
                          setOtherFinancingSource(e.target.value)
                        }
                        placeholder="Especifique outro..."
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id="source-other-yes-desktop"
                          name="source-other-desktop"
                          checked={!!otherFinancingSource}
                          disabled={true}
                          className="mr-1.5"
                        />
                        <Label htmlFor="source-other-yes-desktop">1</Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <input
                          type="radio"
                          id="source-other-no-desktop"
                          name="source-other-desktop"
                          checked={false}
                          disabled={true}
                          className="mr-1.5"
                        />
                        <Label htmlFor="source-other-no-desktop">2</Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleClearSpecificSelection(99)}
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
          </>
        ) : (
          <div className="p-4 bg-white rounded-lg border text-center">
            <p className="text-sm text-gray-500">
              Nenhuma fonte de financiamento disponível. Verifique se o domínio
              FONT_FIN_FUNCIONAMENTO está configurado corretamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}