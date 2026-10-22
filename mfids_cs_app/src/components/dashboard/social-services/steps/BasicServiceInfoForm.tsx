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
import { Switch } from "@/components/ui/switch";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { SocialServiceFormValues } from "@/lib/schemas/services-schema";

interface BasicServiceInfoFormProps {
  form: UseFormReturn<SocialServiceFormValues>;
}

export function BasicServiceInfoForm({ form }: BasicServiceInfoFormProps) {
  const { getServiceAccessDomain } = useEquipmentHooks();
  const { data: accessTypes, isLoading: isLoadingAccess } =
    getServiceAccessDomain();

  const selectedAccessType = form.watch("domain_acesso_gratuito");
  const isLicenciado = form.watch("licenciado");
  useEffect(() => {
    if (!isLicenciado) {
      form.setValue("data_licenciamento", "");
      form.setValue("nr_alvara", "");
      form.clearErrors("data_licenciamento");
      form.clearErrors("nr_alvara");
    } else {
      form.trigger("data_licenciamento");
    }
  }, [isLicenciado, form]);

  const isGratuitoSim = () => {
    return (
      accessTypes?.some(
        (option) =>
          option.id === selectedAccessType &&
          option.domain_description?.includes("Sim")
      ) || false
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-0 rounded-lg  mb-4">
        {/* <h3 className="font-medium mb-2 flex items-center">
          Informações Valências/respostas sociais
        </h3> */}

        <div className="space-y-4">
          {/* <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome da Resposta Social{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome da Resposta Social "
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <div className="grid grid-cols-1 gap-4">
            {/* <FormField
            control={form.control}
            name="nr_valencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Valência</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número da valência (opcional)"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

            <FormField
              control={form.control}
              name="nr_funcionario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Número de Funcionários{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de funcionários "
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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

      <div className="p-0 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">
          Capacidade e Ocupação
        </h3>

        <div className="space-y-4">
<FormField
  control={form.control}
  name="capacidade_instalada"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        Capacidade Instalada <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Input
          type="number"
          min={0}
          placeholder="Número máximo de usuários que podem ser atendidos"
          {...field}
          onChange={(e) => {
            const value = Number(e.target.value);
            field.onChange(value);
            
            // Remove o setTimeout e executa diretamente
            const demografias = form.getValues("demografias") || [];
            const totalDemografia = demografias.reduce(
              (sum, item) => {
                const masculino = Number(item?.total_masculino) || 0;
                const feminino = Number(item?.total_feminino) || 0;
                return sum + masculino + feminino;
              },
              0
            );

            if (totalDemografia > value && totalDemografia > 0 && value > 0) {
              form.setError("capacidade_instalada", {
                type: "validation",
                message: `Capacidade (${value}) menor que total de utentes (${totalDemografia})`,
              });
            } else {
              // Limpa o erro se a validação passar
              form.clearErrors("capacidade_instalada");
            }
          }}
          className="w-full"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

          <FormField
            control={form.control}
            name="nr_medio_utente_dia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Número Médio de Utentes por Dia{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Média diária de usuários"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nr_utente_frequenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Número de Utentes que Frequentam{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Total de usuários frequentes"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nr_utente_abranger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Número de Utentes a Abranger{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Total de usuários que se pretende abranger"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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

      <div className="p-0 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">
          Informações Financeiras
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
            <FormField
              control={form.control}
              name="resposta_social_financiada"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Resposta Social Financiada?
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

          <div className="p-0 rounded-lg  mb-4">
            <h3 className="font-medium mb-4 flex items-center">
              O acesso a valência é gratuito?
            </h3>

            {isLoadingAccess ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : accessTypes && accessTypes.length > 0 ? (
              <FormField
                control={form.control}
                name="domain_acesso_gratuito"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accessTypes.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id?.toString() || ""}
                          >
                            {option.domain_description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            ) : (
              <div className="p-4 bg-white rounded-lg border text-center">
                <p className="text-gray-500">
                  Nenhuma opção de acesso disponível. Verifique se o domínio
                  ACESSO_VAL está configurado corretamente.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mensalidade_min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mensalidade Mínima
                    {!isGratuitoSim() && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Valor mínimo"
                      {...field}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        field.onChange(value);

                        if (!isGratuitoSim() && value === 0) {
                          form.setError("mensalidade_min", {
                            message:
                              "Campo obrigatório quando acesso não é gratuito",
                          });
                        } else {
                          form.clearErrors("mensalidade_min");
                        }
                      }}
                      disabled={isGratuitoSim()}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mensalidade_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mensalidade Máxima
                    {!isGratuitoSim() && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Valor máximo"
                      {...field}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        field.onChange(value);

                        if (!isGratuitoSim() && value === 0) {
                          form.setError("mensalidade_max", {
                            message:
                              "Campo obrigatório quando acesso não é gratuito",
                          });
                        } else {
                          form.clearErrors("mensalidade_max");
                        }
                      }}
                      disabled={isGratuitoSim()}
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

      <div className="p-0 rounded-lg  mb-4">
        <h3 className="font-medium mb-2 flex items-center">Licenciamento</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
            <FormField
              control={form.control}
              name="licenciado"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-2 w-full">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Este serviço é licenciado?
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

          {/* Mostrar campos de licenciamento apenas quando licenciado é true */}
          {isLicenciado && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nr_alvara"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Número do Alvará <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número do alvará"
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
                name="data_licenciamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Data de Licenciamento
                      {isLicenciado && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        pattern="\d{4}-\d{2}-\d{2}"
                        placeholder="AAAA-MM-DD"
                        {...field}
                        className="w-full"
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(
                            dateValue
                          );

                          if (isValidFormat) {
                            field.onChange(dateValue);
                          } else {
                            field.onChange("");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="data_inicio_funcionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Data de Início do Funcionamento{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    pattern="\d{4}-\d{2}-\d{2}"
                    placeholder="AAAA-MM-DD"
                    {...field}
                    className="w-full"
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(
                        dateValue
                      );

                      if (isValidFormat) {
                        field.onChange(dateValue);
                      } else {
                        field.onChange("");
                      }
                    }}
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
