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
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { EquipmentFormValues } from "@/lib/schemas/equipament-schema";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface EquipmentBasicInfoFormProps {
  form: UseFormReturn<EquipmentFormValues>;
  isEditing?: boolean;
}

export function EquipmentBasicInfoForm({ form }: EquipmentBasicInfoFormProps) {
  const { getEquipmentStatusDomain } = useEquipmentHooks();
  const { getManagers } = useOrganizationHooks();
  const { data: equipmentStatus, isLoading: isLoadingStatus } =
    getEquipmentStatusDomain();
  const { data: managers } = getManagers();
  const selectedSituacaoId = form.watch("domain_situacao_equipamento");

  const domain_situacao_equipamento = form.watch("domain_situacao_equipamento");

  const isOutroSituacaoSelecionado = (
    list: any[],
    selectedId: number | undefined
  ) => {
    return (
      list?.find((item) => item.id === selectedId)?.domain_description ===
      "Outro (ESPECIFIQUE)"
    );
  };

  useEffect(() => {
    if (equipmentStatus && selectedSituacaoId) {
      const isOutro = isOutroSituacaoSelecionado(equipmentStatus, selectedSituacaoId);
      if (!isOutro) {
        form.setValue("situacao_equipamento_outro", "");
      }
    }
  }, [selectedSituacaoId, equipmentStatus, form]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nome do Equipamento <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Deve escrever o nome por extenso, sem abreviaturas e em maiúsculas"
                  {...field}
                  className="w-full"
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
          name="domain_situacao_equipamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação do Equipamento</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || field.value?.toString() || ""}
                disabled={isLoadingStatus}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a situação do equipamento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipmentStatus?.map((status) => (
                    <SelectItem
                      key={status.id}
                      value={status.id?.toString() || ""}
                    >
                      {status.domain_description}
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
          name="situacao_equipamento_outro"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Outra Situação{" "}
                {isOutroSituacaoSelecionado(
                  equipmentStatus || [],
                  selectedSituacaoId
                ) && <span className="text-red-500">*</span>}
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="Especifique outra situação se aplicável"
                  {...field}
                  required={true}
                  className="w-full"
                  disabled={
                    !isOutroSituacaoSelecionado(
                      equipmentStatus || [],
                      selectedSituacaoId
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="gestor"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>
              Gestor Responsável <span className="text-red-500">*</span>
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? managers?.find((manager) => manager.id === field.value)
                          ?.nome +
                        " - " +
                        managers?.find((manager) => manager.id === field.value)
                          ?.nif
                      : "Selecione o gestor responsável"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Pesquisar gestor..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum gestor encontrado.</CommandEmpty>
                    <CommandGroup>
                      {managers?.map((manager) => (
                        <CommandItem
                          value={`${manager.nome} ${manager.proprietario_nome} ${manager.nif}`}
                          key={manager.id}
                          onSelect={() => {
                            form.setValue("gestor", manager?.id || 0);
                          }}
                        >
                          <div className="flex-1">
                            <div>{manager.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              Proprietário: {manager.proprietario_nome}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              NIF: {manager.nif}
                            </div>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              manager.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {![111, 112].includes(domain_situacao_equipamento) && (
        <FormField
          control={form.control}
          name="data_oficializacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Data de Oficialização <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {[111, 112].includes(domain_situacao_equipamento) && (
        <FormField
        control={form.control}
        name="data_encerramento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Data de Encerramento <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input type="date" {...field} className="w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      )}

      <FormField
        control={form.control}
        name="ponto_referencia"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ponto de Referência <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input
                placeholder="Ponto de referência para localização"
                {...field}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
