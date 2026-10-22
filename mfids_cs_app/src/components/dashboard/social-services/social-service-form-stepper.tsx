"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  ArrowLeft,
  Save,
  FileText,
  //Users,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { SocialService } from "@/types/type";
import { toast } from "react-hot-toast";
import { Step, Stepper } from "@/components/stepper/stepper";
import { BasicServiceInfoForm } from "./steps/BasicServiceInfoForm";
import { DemographicTableForm } from "./steps/DemographicsForm";
import {
  SocialServiceFormValues,
  socialServiceSchema,
} from "@/lib/schemas/services-schema";
import { OperationInfoForm } from "./steps/OperationInfoForm";
import { ServicesOfferedTableForm } from "./steps/ServicesOfferedTableForm";
import { FinancingAccessForm } from "./steps/FinancingAccessForm";

interface SocialServiceFormStepperProps {
  onComplete: (data: SocialService) => void;
  equipmentId: number;
  initialValues?: Partial<SocialService>;
  isEditing?: boolean;
}

export function SocialServiceFormStepper({
  onComplete,
  equipmentId,
  initialValues,
  isEditing = false,
}: SocialServiceFormStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const form = useForm<SocialServiceFormValues>({
    resolver: zodResolver(socialServiceSchema),
    defaultValues: {
      nome: initialValues?.nome || "",
      licenciado: initialValues?.licenciado || false,
      data_licenciamento: initialValues?.data_licenciamento || "",
      capacidade_instalada: initialValues?.capacidade_instalada || 0,
      meses_operacionais: initialValues?.meses_operacionais || 12,
      mensalidade_min: Number(initialValues?.mensalidade_min ) || 0,
      mensalidade_max: Number(initialValues?.mensalidade_max) || 0,
      nr_valencia: initialValues?.nr_valencia || "",
      nr_funcionario: Number(initialValues?.nr_funcionario) || 0,
      codigo_tipo_resposta: initialValues?.codigo_tipo_resposta || "",
      nr_alvara: initialValues?.nr_alvara || "",
      resposta_social_financiada:
        initialValues?.resposta_social_financiada || false,
      data_inicio_funcionamento: initialValues?.data_inicio_funcionamento || "",
      encerra_ferias: initialValues?.encerra_ferias || false,
      domain_periodo_funcionamento:
        initialValues?.domain_periodo_funcionamento || 0,
      nr_medio_utente_dia: initialValues?.nr_medio_utente_dia || 0,
      nr_utente_frequenta: initialValues?.nr_utente_frequenta || 0,
      nr_utente_abranger: initialValues?.nr_utente_abranger || 0,
      domain_dias_funcionamento: initialValues?.domain_dias_funcionamento || 0,
      domain_meses_funcionamento:
        initialValues?.domain_meses_funcionamento || [],
      operacoes: initialValues?.operacoes || [
        {
          dias_funcionamento: "Segunda a Sexta",
          horario_abertura: "09:00",
          horario_fechamento: "18:00",
        },
      ],
      demografias: initialValues?.demografias || [
        {
          domain_faixa_etaria: "Adultos",
          total_masculino: 0,
          total_feminino: 0,
          deficientes_masculino: 0,
          deficientes_feminino: 0,
        },
      ],
      servicos_oferecidos_outros:
        initialValues?.servicos_oferecidos_outros || "",
      domain_fonte_fin_outros: initialValues?.domain_fonte_fin_outros || 0,
      servicos_oferecidos: initialValues?.servicos_oferecidos,
      equipamento: equipmentId,
      domain_acesso_gratuito: initialValues?.domain_acesso_gratuito || 0,
      fontes_financiamento: initialValues?.fontes_financiamento || [],
    },
  });

  useEffect(() => {
    form.clearErrors();
    setFormError(null);
  }, [activeStep, form]);

  useEffect(() => {
    const validateInitialValues = async () => {
      const newCompletedSteps = [];

      if (initialValues?.nome && initialValues?.codigo_tipo_resposta) {
        newCompletedSteps.push(0);
      }

      if (
        initialValues?.domain_periodo_funcionamento &&
        initialValues?.domain_dias_funcionamento &&
        initialValues?.meses_operacionais &&
        initialValues?.demografias && initialValues.demografias.length > 0
      ) {
        newCompletedSteps.push(1);
      }


      if (
        initialValues?.servicos_oferecidos &&
        initialValues.servicos_oferecidos.length > 0
      ) {
        newCompletedSteps.push(2);
      }

      setCompletedSteps(newCompletedSteps);
    };

    if (initialValues) {
      validateInitialValues();
    }
  }, [initialValues]);

  const validateStep = async (stepIndex: number) => {
    let isValid = false;

    try {
      const fieldsToValidate: Record<number, string[]> = {
        0: [
          //"nome",
          "capacidade_instalada",
          "nr_medio_utente_dia",
          "nr_funcionario",
          "nr_utente_frequenta",
          "nr_utente_abranger",
          "domain_acesso_gratuito",
          "mensalidade_min",
          "mensalidade_max",
          "data_inicio_funcionamento",
          "demografias", "codigo_tipo_resposta"
          //"data_licenciamento"
        ],
        1: [
          "domain_periodo_funcionamento",
          "domain_dias_funcionamento",
          "meses_operacionais",
          "operacoes",
        ],
        2: ["servicos_oferecidos"],
      };

      const fields = fieldsToValidate[stepIndex];

      if (!fields || fields.length === 0) {
        return true;
      }
      if (stepIndex === 0) {
      const formValues = form.getValues();
      
      const demografias = formValues.demografias || [];
      const capacidadeInstalada = formValues.capacidade_instalada || 0;
      
      const totalDemografia = demografias.reduce((sum, item) => {
        const masculino = Number(item?.total_masculino) || 0;
        const feminino = Number(item?.total_feminino) || 0;
        return sum + masculino + feminino;
      }, 0);
      
      if (totalDemografia > capacidadeInstalada && totalDemografia > 0 && capacidadeInstalada > 0) {
        form.setError("capacidade_instalada", {
          type: "validation",
          message: `Capacidade instalada (${capacidadeInstalada}) deve ser maior ou igual ao total de utentes (${totalDemografia})`
        });
        
        toast.error(`Capacidade instalada (${capacidadeInstalada}) deve ser maior ou igual ao total de utentes (${totalDemografia})`, {
          duration: 5000,
          style: { maxWidth: '500px' }
        });
        
        return false;
      }
      
      // Se licenciado é true, data_licenciamento é obrigatória
      if (formValues.licenciado) {
        if (!formValues.data_licenciamento || formValues.data_licenciamento.trim() === "") {
          form.setError("data_licenciamento", {
            type: "required",
            message: "Data de licenciamento é obrigatória quando o serviço é licenciado"
          });
          
          toast.error("Data de licenciamento é obrigatória quando o serviço é licenciado.", {
            duration: 5000,
            style: { maxWidth: '500px' }
          });
          
          return false;
        }
        
        if (!formValues.nr_alvara || formValues.nr_alvara.trim() === "") {
          form.setError("nr_alvara", {
            type: "required",
            message: "Número do alvará é obrigatório quando o serviço é licenciado"
          });
          
          toast.error("Número do alvará é obrigatório quando o serviço é licenciado.", {
            duration: 5000,
            style: { maxWidth: '500px' }
          });
          
          return false;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(formValues.data_licenciamento)) {
          form.setError("data_licenciamento", {
            type: "pattern",
            message: "Data deve estar no formato YYYY-MM-DD"
          });
          
          toast.error("Data de licenciamento deve estar no formato YYYY-MM-DD.", {
            duration: 5000,
            style: { maxWidth: '500px' }
          });
          
          return false;
        }
      }
    }


        if (stepIndex === 1) {
      const formValues = form.getValues();
      
      if (formValues.meses_operacionais < 12) {
        if (!formValues.domain_meses_funcionamento || formValues.domain_meses_funcionamento.length === 0) {
          form.setError("domain_meses_funcionamento", {
            type: "required",
            message: "Deve selecionar pelo menos um mês de encerramento quando opera menos de 12 meses"
          });
          
          toast.error("Deve selecionar pelo menos um mês de encerramento quando opera menos de 12 meses por ano.", {
            duration: 5000,
            style: { maxWidth: '500px' }
          });
          
          return false;
        }
      }
      
      if (!formValues.operacoes || formValues.operacoes.length === 0) {
        toast.error("Deve adicionar pelo menos um horário de funcionamento.", {
          duration: 5000,
          style: { maxWidth: '500px' }
        });
        return false;
      }
      
      for (let i = 0; i < formValues.operacoes.length; i++) {
        const operacao = formValues.operacoes[i];
        if (!operacao.dias_funcionamento || !operacao.horario_abertura || !operacao.horario_fechamento) {
          toast.error(`Horário #${i + 1}: Todos os campos (dias, abertura e fechamento) devem ser preenchidos.`, {
            duration: 5000,
            style: { maxWidth: '500px' }
          });
          return false;
        }
      }
    }

      await form.trigger(fields as any);

      const { errors } = form.formState;
      const hasErrors = fields.some((field) => {
        if (field.includes(".")) {
          const [parent, child] = field.split(".");
          return (
            errors[parent as keyof typeof errors] as Record<string, any>
          )?.[child];
        }
        return !!errors[field as keyof typeof errors];
      });

      isValid = !hasErrors;

      if (!isValid) {
        const errorMessages: string[] = [];

        fields.forEach((field) => {
          const error = errors[field as keyof typeof errors];
          if (error?.message) {
            errorMessages.push(`${field}: ${error.message}`);
          }
        });
        if (errorMessages.length > 0) {
          toast.error(
            <div className="space-y-1">
              <p className="font-bold">
                Por favor, corrija os seguintes erros:
              </p>
              <ul className="list-disc pl-4">
                {errorMessages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>,
            {
              duration: 5000,
              style: { maxWidth: "500px" },
            }
          );
        } else {
          toast.error(
            "Por favor, corrija os campos com erro antes de prosseguir."
          );
        }

        setFormError(null);
      } else {
        setFormError(null);
      }
    } catch (error) {
      console.error("Erro ao validar etapa:", error);
      setFormError("Ocorreu um erro ao validar os dados do formulário.");
      isValid = false;
    }

    return isValid;
  };

  const handleNext = async () => {
    try {
      form.clearErrors();
      setFormError(null);

      const isValid = await validateStep(activeStep);

      if (isValid) {
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }

        const nextStep = Math.min(activeStep + 1, 3);
        setActiveStep(nextStep);
      }
    } catch (error) {
      console.error("Erro ao avançar step:", error);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 0));
      form.clearErrors();
      setFormError(null);

      const isValid = await validateStep(activeStep);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const formValues = form.getValues();

      const serviceData: SocialService = {
        ...formValues,
        equipamento: equipmentId,
      };

      if(serviceData?.data_licenciamento === "") {
        delete serviceData?.data_licenciamento;
      }

      if (isEditing && initialValues?.id) {
        serviceData.id = initialValues.id;
      }
      await onComplete(serviceData);
    } catch (error: any) {
      setFormError(error.message || "Erro ao enviar o formulário");
      toast.error("Erro ao salvar valências/respostas sociais");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (index: number) => {
    if (completedSteps.includes(index)) {
      return <CheckCircle2 className="h-4 w-4 text-white" />;
    }
    if (index === 0) return <FileText className="h-4 w-4" />;
    if (index === 1) return <Clock className="h-4 w-4" />;
    //if (index === 2) return <Users className="h-4 w-4" />;
    if (index === 2) return <Briefcase className="h-4 w-4" />;
    if (index === 3) return <DollarSign className="h-4 w-4" />;
  };

  return (
    <Card className="w-full  mx-auto border shadow-md overflow-hidden">
      <CardHeader></CardHeader>
      <CardContent>
        <Stepper activeStep={activeStep} className="mb-8">
          {[0, 1, 2, 3].map((index) => (
            <Step
              key={index}
              title={
                index === 0
                  ? "Informações Básicas"
                  : index === 1
                  ? "Funcionamento"
                  // : index === 2
                  // ? "Demografia"
                  : index === 2
                  ? "Serviços Oferecidos"
                  : "Financiamento"
              }
              description={
                index === 0
                  ? "Nome, Tipo, Capacidade"
                  : index === 1
                  ? "Horários, Dias, Períodos"
                  // : index === 2
                  // ? "Faixas Etárias, Utilizadors"
                  : index === 2
                  ? "Serviços Disponíveis"
                  : "Fontes e Acesso"
              }
              icon={getStepIcon(index)}
              index={index}
              completed={completedSteps.includes(index)}
              active={activeStep === index}
              onClick={() => {
                if (completedSteps.includes(index)) {
                  setActiveStep(index);
                }
              }}
              className={completedSteps.includes(index) ? "cursor-pointer" : ""}
            />
          ))}
        </Stepper>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activeStep === 3) {
                handleSubmit();
              } else {
                handleNext();
              }
            }}
            className="space-y-4"
          >
            <div className="mt-6 bg-white p-4 rounded-lg border">
              {activeStep === 0 && <div className="space-y-4">
                <DemographicTableForm form={form} />
              <BasicServiceInfoForm form={form} />
              
              </div>}
              {activeStep === 1 && <OperationInfoForm form={form} />}
              {/* {activeStep === 2 && <DemographicTableForm form={form} />} */}
              {activeStep === 2 && <ServicesOfferedTableForm form={form} />}
              {activeStep === 3 && <FinancingAccessForm form={form} />}
            </div>

            {formError && (
              <Alert variant="destructive" className="flex items-start mt-4">
                <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
                className="px-4 py-2 border-gray-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>

              <div className="flex gap-3">
                {activeStep < 3 && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNext();
                    }}
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#028eab" }}
                    className="px-5 py-2"
                  >
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {activeStep === 3 && (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#028eab" }}
                    className="px-5 py-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Salvar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
