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
  Building,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Hammer,
  Droplets,
  Home,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Step, Stepper } from "@/components/stepper/stepper";
import { ContactInfoForm } from "@/components/dashboard/organizations/steps/ContactInfoForm";
import { GeographicInfoForm } from "@/components/dashboard/organizations/steps/GeographicInfoForm";
import { Equipment } from "@/types/type";
import {
  equipmentFormSchema,
  EquipmentFormValues,
} from "@/lib/schemas/equipament-schema";
import { EquipmentBasicInfoForm } from "./steps/EquipmentBasicInfoForm";
import { ConstructionInfoForm } from "./steps/ConstructionInfoForm";
import { UtilitiesInfoForm } from "./steps/UtilitiesInfoForm";
import { FinancingInfoForm } from "./steps/FinancingInfoForm";
import { useEquipmentHooks } from "@/hooks/use-equipament";

interface EquipmentFormStepperProps {
  onComplete: (data: Equipment, moveToServices?: boolean) => void;
  initialValues?: Partial<Equipment>;
  isEditing?: boolean;
}

export function EquipmentFormStepper({
  onComplete,
  initialValues,
  isEditing = false,
}: EquipmentFormStepperProps) {
  const { getEquipmentStatusDomain } = useEquipmentHooks();
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { data: equipmentStatusData } = getEquipmentStatusDomain();
  const geoInitialValues =
    typeof initialValues?.geografia === "object"
      ? {
          ilha: initialValues.geografia.ilha || "",
          concelho: initialValues.geografia.concelho || "",
          freguesia: initialValues.geografia.freguesia || "",
          zona: initialValues.geografia.zona || "",
          lugar: initialValues.geografia.lugar || "",
        }
      : undefined;

  const {
    getBuildingTypeDomain,
    getConstructionTypeDomain,
    getPropertyRegimeDomain,
    getTrashCollectionDomain,
  } = useEquipmentHooks();
  const { data: buildingTypesData } = getBuildingTypeDomain();
  const { data: constructionTypesData } = getConstructionTypeDomain();
  const { data: propertyRegimesData } = getPropertyRegimeDomain();
  const { data: trashCollectionData } = getTrashCollectionDomain();

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      nome: initialValues?.nome || "",
      //codigo: initialValues?.codigo || "",
      data_oficializacao: initialValues?.data_oficializacao || "",
      data_encerramento: initialValues?.data_encerramento || "",
      possui_eletricidade: initialValues?.possui_eletricidade || false,
      latitude: initialValues?.latitude || "",
      longitude: initialValues?.longitude || "",
      altura: initialValues?.altura || "",
      ponto_referencia: initialValues?.ponto_referencia || "",
      geografia: {
        ilha:
          typeof initialValues?.geografia === "object"
            ? initialValues.geografia.ilha || ""
            : "",
        concelho:
          typeof initialValues?.geografia === "object"
            ? initialValues.geografia.concelho || ""
            : "",
        freguesia:
          typeof initialValues?.geografia === "object"
            ? initialValues.geografia.freguesia || ""
            : "",
        zona:
          typeof initialValues?.geografia === "object"
            ? initialValues.geografia.zona || ""
            : "",
        lugar:
          typeof initialValues?.geografia === "object"
            ? initialValues.geografia.lugar || ""
            : "",
        id:
          typeof initialValues?.geografia === "object" &&
          initialValues.geografia?.id
            ? initialValues.geografia?.id?.toString()
            : "",
      },
      contato: {
        endereco:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.endereco || ""
            : "",
        caixa_postal:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.caixa_postal || ""
            : "",
        telefone:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.telefone || ""
            : "",
        telemovel:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.telemovel || ""
            : "",
        email:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.email || ""
            : "",
        website:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.website || ""
            : "",
      },
      n_andar: initialValues?.n_andar || 0,
      gestor: initialValues?.gestor || 0,
      domain_situacao_equipamento:
        typeof initialValues?.domain_situacao_equipamento === "object"
          ? Number(initialValues.domain_situacao_equipamento?.id)
          : 0,
      situacao_equipamento_outro:
        initialValues?.situacao_equipamento_outro || "",
      domain_situacao_juridica: initialValues?.domain_situacao_juridica
        ? Number(initialValues.domain_situacao_juridica)
        : 0,
      domain_regime_propriedade:
        typeof initialValues?.domain_regime_propriedade === "object"
          ? Number(initialValues.domain_regime_propriedade?.id)
          : 0,
      regime_propriedade_outro: initialValues?.regime_propriedade_outro || "",
      tipo_edificacao_outro: initialValues?.tipo_edificacao_outro || "",
      domain_tipo_edificacao:
        typeof initialValues?.domain_tipo_edificacao === "object"
          ? Number(initialValues.domain_tipo_edificacao?.id)
          : 0,
      domain_estado_conservacao:
        typeof initialValues?.domain_estado_conservacao === "object"
          ? Number(initialValues.domain_estado_conservacao?.id)
          : 0,
      domain_tipo_construcao_outro:
        typeof initialValues?.domain_tipo_construcao_outro === "object"
          ? Number(initialValues.domain_tipo_construcao_outro?.id)
          : 0,
      tipo_construcao_outro: initialValues?.tipo_construcao_outro || "",
      fonte_financiamento_outro:
        typeof initialValues?.fonte_financiamento_outro === "string"
          ? initialValues.fonte_financiamento_outro
          : "",
      remodelado: initialValues?.remodelado || false,
      fonte_fin_remodelacao_outro:
        typeof initialValues?.fonte_fin_remodelacao_outro === "string"
          ? initialValues.fonte_fin_remodelacao_outro
          : "",
      domain_ligacao_rede_publica:
        typeof initialValues?.domain_ligacao_rede_publica === "object"
          ? Number(initialValues.domain_ligacao_rede_publica?.id)
          : 0,
      domain_sanita_latrina:
        typeof initialValues?.domain_sanita_latrina === "object"
          ? Number(initialValues.domain_sanita_latrina?.id)
          : 0,
      banheiro_poliban: initialValues?.banheiro_poliban || false,
      domain_evacuacao_agua:
        typeof initialValues?.domain_evacuacao_agua === "object"
          ? Number(initialValues.domain_evacuacao_agua?.id)
          : 0,
      domain_possui_cozinha:
        typeof initialValues?.domain_possui_cozinha === "object"
          ? Number(initialValues.domain_possui_cozinha?.id)
          : 0,
      domain_colecta_lixo:
        typeof initialValues?.domain_colecta_lixo === "object"
          ? Number(initialValues.domain_colecta_lixo?.id)
          : 0,
      colecta_lixo_outro: initialValues?.colecta_lixo_outro || "",
      acesso_a_deficiente: initialValues?.acesso_a_deficiente || false,
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

      if (initialValues?.nome) {
        newCompletedSteps.push(0);
      }

      if (initialValues?.contato?.telemovel) {
        newCompletedSteps.push(1);
      }

      if (initialValues?.geografia) {
        newCompletedSteps.push(2);
      }

      if (initialValues?.domain_tipo_construcao_outro) {
        newCompletedSteps.push(3);
      }

      setCompletedSteps(newCompletedSteps);
    };

    if (initialValues) {
      validateInitialValues();
    }
  }, [initialValues]);

  const validateStep = async (stepIndex: number) => {
    let isValid = false;
    const buildingType = form.getValues("domain_tipo_edificacao");
    const buildingTypeOutro = form.getValues("tipo_edificacao_outro");

    const constructionType = form.getValues("domain_tipo_construcao_outro");
    const constructionTypeOutro = form.getValues("tipo_construcao_outro");

    const propertyRegime = form.getValues("domain_regime_propriedade");
    const propertyRegimeOutro = form.getValues("regime_propriedade_outro");

    const sistemaColetaLixo = form.getValues("domain_colecta_lixo");
    const sistemaColetaLixoOutro = form.getValues("colecta_lixo_outro");

    const isOutroSelecionado = (
      list: any[] | undefined,
      selectedId: number
    ) => {
      return (
        list?.some(
          (item) =>
            item.id === selectedId &&
            item.domain_description === "Outro (ESPECIFIQUE)"
        ) || false
      );
    };

    try {
      const fieldsToValidate: Record<number, string[]> = {
        0: ["nome", "gestor", "data_oficializacao", "ponto_referencia"], // Informações Básicas
        1: ["contato"], // Contato
        2: ["geografia"], // Localização
        3: [
          "domain_tipo_edificacao",
          "regime_propriedade",
          "domain_estado_conservacao",
          "latitude",
          "longitude",
        ],
        4: ["tipo_sanitario", "sistema_coleta_lixo"], // Utilities
        5: ["domain_situacao_equipamento", "tipo_construcao_outro"], // Financiamento (opcional)
      };
      const fields = fieldsToValidate[stepIndex];

      if (!fields || fields.length === 0) {
        return true;
      }

      await form.trigger(fields as any);

      const situacaoEquipamento = form.getValues("domain_situacao_equipamento");

      if ([111, 112].includes(situacaoEquipamento)) {
        const dataEncerramento = form.getValues("data_encerramento");
        if (!dataEncerramento || dataEncerramento.trim() === "") {
          form.setError("data_encerramento", {
            type: "required",
            message: "Data de encerramento é obrigatória",
          });
          if (!fields.includes("data_encerramento")) {
            fields.push("data_encerramento");
          }
        }
      } else {
        const dataOficializacao = form.getValues("data_oficializacao");
        if (!dataOficializacao || dataOficializacao.trim() === "") {
          form.setError("data_oficializacao", {
            type: "required",
            message: "Data de oficialização é obrigatória",
          });
          if (!fields.includes("data_oficializacao")) {
            fields.push("data_oficializacao");
          }
        }
      }
      if (stepIndex === 0) {
        const situacaoEquipamento = form.getValues(
          "domain_situacao_equipamento"
        );
        const situacaoOutro = form.getValues("situacao_equipamento_outro");

        const isOutroSelected = equipmentStatusData?.some(
          (item) =>
            item.id === situacaoEquipamento &&
            item.domain_description?.includes("Outro")
        );

        if (
          isOutroSelected &&
          (!situacaoOutro || situacaoOutro.trim() === "")
        ) {
          form.setError("situacao_equipamento_outro", {
            type: "required",
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });

          if (!fields.includes("situacao_equipamento_outro")) {
            fields.push("situacao_equipamento_outro");
          }
        }
      }

      if (stepIndex === 3) {
        if (
          isOutroSelecionado(buildingTypesData, buildingType) &&
          (!buildingTypeOutro || buildingTypeOutro.trim() === "")
        ) {
          form.setError("tipo_edificacao_outro", {
            type: "required",
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });

          if (!fields.includes("tipo_edificacao_outro")) {
            fields.push("tipo_edificacao_outro");
          }
        }

        const buildingTypeItem = buildingTypesData?.find(
          (item) => item.id === buildingType
        );
        const isApartmentType =
          buildingTypeItem?.domain_description === "Andar/Apartamento";

        if (isApartmentType) {
          const nAndar = form.getValues("n_andar");
          if (!nAndar || nAndar <= 0) {
            form.setError("n_andar", {
              type: "required",
              message: "Número do andar é obrigatório para Andar/Apartamento",
            });

            if (!fields.includes("n_andar")) {
              fields.push("n_andar");
            }
          }
        }

        if (
          isOutroSelecionado(propertyRegimesData, propertyRegime) &&
          (!propertyRegimeOutro || propertyRegimeOutro.trim() === "")
        ) {
          form.setError("regime_propriedade_outro", {
            type: "required",
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });

          if (!fields.includes("regime_propriedade_outro")) {
            fields.push("regime_propriedade_outro");
          }
        }
      }

      if (stepIndex === 4) {
        if (
          isOutroSelecionado(trashCollectionData, sistemaColetaLixo ?? 0) &&
          (!sistemaColetaLixoOutro || sistemaColetaLixoOutro.trim() === "")
        ) {
          form.setError("colecta_lixo_outro", {
            type: "required",
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });

          if (!fields.includes("colecta_lixo_outro")) {
            fields.push("colecta_lixo_outro");
          }
        }
      }
      if (stepIndex === 5) {
        if (
          isOutroSelecionado(constructionTypesData, constructionType ?? 0) &&
          (!constructionTypeOutro || constructionTypeOutro.trim() === "")
        ) {
          form.setError("tipo_construcao_outro", {
            type: "required",
            message: "Este campo é obrigatório quando 'Outro' é selecionado",
          });

          if (!fields.includes("tipo_construcao_outro")) {
            fields.push("tipo_construcao_outro");
          }
        }
      }

      const { errors } = form.formState;
      const hasErrors = fields.some((field) => {
        if (field.includes(".")) {
          const [parent, child] = field.split(".");
          return (errors as any)[parent]?.[child];
        }
        return !!(errors as any)[field];
      });

      if (hasErrors) {
        const errorMessages: string[] = [];

        fields.forEach((field) => {
          if (field.includes(".")) {
            const [parent, child] = field.split(".");
            const error = (errors as any)[parent]?.[child];
            if (error?.message) {
              errorMessages.push(`${field}: ${error.message}`);
            }
          } else {
            const error = (errors as any)[field];
            if (error?.message) {
              errorMessages.push(`${field}: ${error.message}`);
            }
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
        isValid = false;
      } else {
        setFormError(null);
        isValid = true;
      }
    } catch (error) {
      console.error("Erro ao validar etapa:", error);
      toast.error("Ocorreu um erro ao validar os dados do formulário.");
      setFormError(null);
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

        const situacaoEquipamento = form.getValues(
          "domain_situacao_equipamento"
        );
        const maxStep = [111, 112].includes(situacaoEquipamento) ? 3 : 5;
        const nextStep = Math.min(activeStep + 1, maxStep);
        setActiveStep(nextStep);
      }
    } catch (error) {
      console.error("Erro ao avançar step:", error);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (saveAndAddServices: boolean = false) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      form.clearErrors();
      setFormError(null);

      const isValid = await validateStep(activeStep);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const formValues = form.getValues();

      const geografia =
        typeof formValues.geografia === "object" && formValues.geografia.id
          ? Number(formValues.geografia.id)
          : 0;

      const equipmentData: Equipment = {
        ...formValues,
        geografia: geografia,
      };

      if (equipmentData?.data_oficializacao === "") {
        delete equipmentData?.data_oficializacao;
      }
      if (equipmentData?.data_encerramento === "") {
        delete equipmentData?.data_encerramento;
      }
      if (isEditing && initialValues?.id) {
        equipmentData.id = initialValues.id;
      }

      await onComplete(equipmentData, saveAndAddServices);
    } catch (error: any) {
      setFormError(error.message || "Erro ao enviar o formulário");
      toast.error("Erro ao salvar equipamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (index: number) => {
    if (completedSteps.includes(index)) {
      return <CheckCircle2 className="h-4 w-4 text-white" />;
    }
    if (index === 0) return <Building className="h-4 w-4" />;
    if (index === 1) return <Phone className="h-4 w-4" />;
    if (index === 2) return <MapPin className="h-4 w-4" />;
    if (index === 3) return <Hammer className="h-4 w-4" />;
    if (index === 4) return <Droplets className="h-4 w-4" />;
    if (index === 5) return <Home className="h-4 w-4" />;
  };

  const situacaoEquipamento = form.getValues(
                    "domain_situacao_equipamento"
                  );
                  const isLastStep = [111, 112].includes(situacaoEquipamento)
                    ? activeStep === 3
                    : activeStep === 5;

  return (
    <Card className="w-full mx-auto border shadow-md overflow-hidden">
      <CardHeader></CardHeader>
      <CardContent>
        <Stepper activeStep={activeStep} className="mb-8">
          {[0, 1, 2, 3, 4, 5]
            .filter((index) => {
              const situacaoEquipamento = form.getValues(
                "domain_situacao_equipamento"
              );
              if ([111, 112].includes(situacaoEquipamento)) {
                return index <= 3; // Mostra apenas até step 4
              }
              return true; // Mostra todos os steps
            })
            .map((index) => (
              <Step
                key={index}
                title={
                  index === 0
                    ? "Informações Básicas"
                    : index === 1
                    ? "Contato"
                    : index === 2
                    ? "Localização"
                    : index === 3
                    ? "Construção"
                    : index === 4
                    ? "Utilitários"
                    : "Financiamento"
                }
                description={
                  index === 0
                    ? "Nome, Código, Estado"
                    : index === 1
                    ? "Endereço, Telefone, Email"
                    : index === 2
                    ? "Ilha, Concelho, Freguesia"
                    : index === 3
                    ? "Tipo, Regime, Conservação"
                    : index === 4
                    ? "Água, Sanitários, Energia"
                    : "Fontes de Financiamento"
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
                className={
                  completedSteps.includes(index) ? "cursor-pointer" : ""
                }
              />
            ))}
        </Stepper>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLastStep && activeStep === 5) {
                handleNext();
                handleSubmit(false);
              } else {
                handleNext();
              }
            }}
            className="space-y-4"
          >
            <div className="mt-6 bg-white p-4 rounded-lg border">
              {activeStep === 0 && (
                <EquipmentBasicInfoForm isEditing={isEditing} form={form} />
              )}
              {activeStep === 1 && <ContactInfoForm form={form} />}
              {activeStep === 2 && (
                <GeographicInfoForm
                  form={form as any}
                  initialValues={geoInitialValues}
                />
              )}
              {activeStep === 3 && <ConstructionInfoForm form={form} />}
              {activeStep === 4 && <UtilitiesInfoForm form={form} />}
              {activeStep === 5 && <FinancingInfoForm form={form} />}
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
                {(() => {
                 
                  return !isLastStep ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        handleNext();
                        e.preventDefault();
                      }}
                      disabled={isSubmitting}
                      style={{ backgroundColor: "#028eab" }}
                      className="px-5 py-2"
                    >
                      Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNext();
                        setIsSubmitting(true);
                        handleSubmit(false);
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
                  );
                })()}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
