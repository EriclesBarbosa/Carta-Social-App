"use client";

import React, { useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Calendar, Plus, Trash2 } from "lucide-react";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { SocialServiceFormValues } from "@/lib/schemas/services-schema";

interface OperationInfoFormProps {
  form: UseFormReturn<SocialServiceFormValues>;
}

export function OperationInfoForm({ form }: OperationInfoFormProps) {
  const { getOperationPeriodDomain, getOperationDaysDomain, getMonthsDomain } = useEquipmentHooks();
  
  const { data: operationPeriods, isLoading: isLoadingPeriods } = getOperationPeriodDomain();
  const { data: operationDays, isLoading: isLoadingDays } = getOperationDaysDomain();
  const { data: monthsData } = getMonthsDomain();

  const mesesOperacionais = form.watch("meses_operacionais");
  const mesesFuncionamento = form.watch("domain_meses_funcionamento");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "operacoes",
  });

useEffect(() => {
  const mesesEncerramento = 12 - mesesOperacionais;
  
  if (mesesOperacionais < 12) {
    if (!mesesFuncionamento || mesesFuncionamento.length === 0) {
      form.setError("domain_meses_funcionamento", {
        type: "required",
        message: `Deve selecionar ${mesesEncerramento} ${mesesEncerramento === 1 ? 'mês' : 'meses'} de encerramento quando opera ${mesesOperacionais} meses`
      });
    } else if (mesesFuncionamento.length !== mesesEncerramento) {
      form.setError("domain_meses_funcionamento", {
        type: "invalid",
        message: `Deve selecionar exatamente ${mesesEncerramento} ${mesesEncerramento === 1 ? 'mês' : 'meses'} de encerramento`
      });
    } else {
      form.clearErrors("domain_meses_funcionamento");
    }
  } else {
    form.clearErrors("domain_meses_funcionamento");
  }
}, [mesesOperacionais, mesesFuncionamento, form]);

const mesesEncerramentoPermitidos = 12 - mesesOperacionais;
const isCheckboxDisabled = (monthId: string) => {
  if (mesesOperacionais >= 12) return false;
  const isSelected = mesesFuncionamento?.includes(monthId);
  const limitReached = (mesesFuncionamento?.length || 0) >= mesesEncerramentoPermitidos;
  return !isSelected && limitReached;
};

  const addOperationHours = () => {
    append({
      dias_funcionamento: "",
      horario_abertura: "",
      horario_fechamento: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-0 md:p-4 rounded-lg mb-4">
        <h3 className="font-medium mb-2 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" /> 
          Período de Funcionamento
        </h3>
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="domain_periodo_funcionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Período de Funcionamento <span className="text-red-500">*</span></FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={isLoadingPeriods}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período de funcionamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {operationPeriods?.map((period) => (
                      <SelectItem 
                        key={period.id} 
                        value={period.id?.toString() || ""}
                      >
                        {period.domain_description}
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
            name="domain_dias_funcionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dias de Funcionamento <span className="text-red-500">*</span></FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={isLoadingDays}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os dias de funcionamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {operationDays?.map((day) => (
                      <SelectItem 
                        key={day.id} 
                        value={day.id?.toString() || ""}
                      >
                        {day.domain_description}
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
            name="meses_operacionais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meses Operacionais por Ano <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min={1}
                    max={12}
                    placeholder="Quantidade de meses em que opera por ano" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : "";
                      field.onChange(value);
                    }}
                    className="w-full"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
            <FormField
              control={form.control}
              name="encerra_ferias"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Encerra para férias?
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
        </div>
      </div>

      <div className="p-0 md:p-4 rounded-lg mb-4">
        <h3 className="font-medium mb-2 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-green-600" /> 
          Se menos de 12 meses, quais os meses de encerramento?
          {mesesOperacionais < 12 && <span className="text-red-500 ml-1">*</span>}
        </h3>
        
        <FormField
          control={form.control}
          name="domain_meses_funcionamento"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {monthsData?.map((month) => (
                  <FormItem
                    key={month.id}
                    className="flex items-center space-x-2 bg-white p-2 rounded-md border"
                  >
                    <FormControl>
                      <Checkbox
                      disabled={isCheckboxDisabled(month.id?.toString() || "")}
                        checked={field.value?.includes(month.id?.toString() || "")}
                        onCheckedChange={(checked) => {
                          const monthId = month.id?.toString() || "";
                          if (checked) {
                            field.onChange([...(field.value || []), monthId]);
                          } else {
                            field.onChange(
                              field.value?.filter((value) => value !== monthId) || []
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer font-normal">
                      {month.domain_description}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
             
            </FormItem>
          )}
        />
      </div>

      <div className="p-0 md:p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium flex items-center">
            <Clock className="h-5 w-5 mr-2 text-amber-600" /> 
            Horários de Funcionamento
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={addOperationHours}
            variant="outline"
            style={{ color: "#028eab", borderColor: "#028eab" }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Horário
          </Button>
        </div>
        
        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-lg border">
              <p className="text-gray-500">Nenhum horário de funcionamento definido</p>
              <Button
                type="button"
                size="sm"
                onClick={addOperationHours}
                variant="outline"
                className="mt-2"
                style={{ color: "#028eab", borderColor: "#028eab" }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Horário
              </Button>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id} className="border shadow-sm">
                <CardHeader className="py-3 px-4 bg-gray-50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Horário #{index + 1}</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-3">
                  <FormField
                    control={form.control}
                    name={`operacoes.${index}.dias_funcionamento`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dias de Funcionamento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Segunda a Sexta, Sábados, etc." 
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`operacoes.${index}.horario_abertura`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Abertura</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
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
                      name={`operacoes.${index}.horario_fechamento`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Fechamento</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}