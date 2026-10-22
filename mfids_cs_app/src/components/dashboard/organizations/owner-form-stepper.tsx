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
  User, 
  MapPin, 
  Phone, 
  CheckCircle2,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import { OwnerFormValues } from "@/lib/schemas/organization-schema";
import { Step, Stepper } from "@/components/stepper/stepper";
import { GeographicInfoForm } from "./steps/GeographicInfoForm";
import { OwnerBasicInfoForm } from "./steps/OwnerBasicInfoForm";
import { ContactInfoForm } from "./steps/ContactInfoForm";
import { validateStep } from "@/lib/validations";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Owner } from "@/types/type";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { useRouter } from "next/navigation";
import { formatError } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface OwnerFormStepperProps {
  initialValues?: Partial<Owner>;
  isEditing?: boolean;
}

export function OwnerFormStepper({
  initialValues,
  isEditing = false,
}: OwnerFormStepperProps) {
  const router = useRouter();
  const {  hasUserType } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isPG, setIsPG] = useState(false);

  const { getOwners, createOwner, updateOwner } = useOrganizationHooks();
  const { refetch } = getOwners();

  const geoInitialValues = typeof initialValues?.geografia === 'object' ? {
    ilha: initialValues.geografia.ilha,
    concelho: initialValues.geografia.concelho,
    freguesia: initialValues.geografia.freguesia,
    zona: initialValues.geografia.zona,
    lugar: initialValues.geografia.lugar,
  } : undefined;

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(undefined as any),
    defaultValues: {
      nome: initialValues?.nome || "",
      nif: initialValues?.nif || "",
      natureza_juridica: initialValues?.natureza_juridica || "",
      natureza_juridica_outro: initialValues?.natureza_juridica_outro || "",
      tipo_organizacao: initialValues?.tipo_organizacao || "P",
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
      geografia: {
        ilha: typeof initialValues?.geografia === "object"
          ? initialValues?.geografia?.ilha || ""
          : "",
        concelho: typeof initialValues?.geografia === "object"
          ? initialValues?.geografia?.concelho || ""
          : "",
        freguesia: typeof initialValues?.geografia === "object"
          ? initialValues?.geografia?.freguesia || ""
          : "",
        zona: typeof initialValues?.geografia === "object"
          ? initialValues?.geografia?.zona || ""
          : "",
        lugar: typeof initialValues?.geografia === "object"
          ? initialValues?.geografia?.lugar || ""
          : "",
        id: typeof initialValues?.geografia === "object" && initialValues?.geografia?.id
          ? initialValues.geografia.id.toString()
          : typeof initialValues?.geografia === "number"
          ? initialValues.geografia.toString()
          : "",
      },
    },
  });

  useEffect(() => {
    if (initialValues?.tipo_organizacao === "PG") {
      setIsPG(true);
    }
  }, [initialValues]);

  useEffect(() => {
    form.clearErrors();
    setFormError(null);
  }, [activeStep, form]);

  useEffect(() => {
    const validateInitialValues = async () => {
      const newCompletedSteps = [];
      
      const step0Valid = await validateStep(0, form, () => {});
      if (step0Valid) newCompletedSteps.push(0);
      
      const step1Valid = await validateStep(1, form, () => {});
      if (step1Valid) newCompletedSteps.push(1);
      
      const step2Valid = await validateStep(2, form, () => {});
      if (step2Valid) newCompletedSteps.push(2);
      
      setCompletedSteps(newCompletedSteps);
    };
    
    if (initialValues) {
      validateInitialValues();
    }
  }, [initialValues, form]);

  const handleNext = async () => {
    try {
      form.clearErrors();
      setFormError(null);
      
      const isValid = await validateStep(activeStep, form, setFormError);

      if (isValid) {
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        
        const nextStep = Math.min(activeStep + 1, 2);
        setActiveStep(nextStep);
      }
    } catch (error) {
      console.error("Erro ao avançar step:", error);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (saveAndAddManager: boolean = false) => {
    try {
      setIsSubmitting(true);
      form.clearErrors();
      setFormError(null);

      const isValid = await validateStep(activeStep, form, setFormError);
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const formValues = form.getValues();
      const geografiaId: any = formValues.geografia.id;

      const ownerData: Owner = {
        nome: formValues.nome,
        nif: formValues.nif,
        natureza_juridica: formValues.natureza_juridica,
        tipo_organizacao: isPG ? "PG" : "P",
        natureza_juridica_outro: formValues.natureza_juridica_outro,
        contato: formValues.contato,
        geografia: parseInt(geografiaId),
      };

      if (isEditing) {
        if (ownerData.contato) {
          if (typeof ownerData.contato === "object" && "email" in ownerData.contato) {
            delete ownerData.contato.email;
          }
        }
      }
      if (isEditing && initialValues?.id) {
        ownerData.id = initialValues.id;
      }
      
      try {
        const result: any = isEditing ? await updateOwner(ownerData) : await createOwner(ownerData);
        refetch();
        if (saveAndAddManager && result.id) {
          router.push(`/dashboard/gestores/criar/${result.return_id}`);
        } else {
          if (hasUserType("P")) {
            router.push(`/dashboard/proprietarios/${result.id}`);
          } else {
            router.push("/dashboard/proprietarios");
          }
        }
      } catch (error: any) {
        const errorMessage =  formatError(error);
              
        toast.error(
          <div className="max-h-80 overflow-auto">
            <p className="font-bold mb-2">Erro ao salvar proprietário:</p>
            <pre className="whitespace-pre-wrap text-xs bg-red-50 p-2 rounded">{errorMessage}</pre>
          </div>,
          {
            duration: 8000,
            style: {
              maxWidth: '500px',
              background: '#FEF2F2',
              color: '#B91C1C'
            },
          }
        );
      }
      
    } catch (error: any) {
      setFormError(error.message || "Erro ao enviar o formulário");
      toast.error("Erro ao salvar proprietário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepIcon = (index: number) => {
    if (completedSteps.includes(index)) {
      return <CheckCircle2 className="h-4 w-4 text-white" />;
    }
    if (index === 0) return <User className="h-4 w-4" />;
    if (index === 1) return <Phone className="h-4 w-4" />;
    if (index === 2) return <MapPin className="h-4 w-4" />;
  };

  return (
    <Card className="w-full  mx-auto border shadow-md overflow-hidden">
      <CardHeader></CardHeader>
      <CardContent>
        <Stepper activeStep={activeStep} className="mb-8">
          {[0, 1, 2].map((index) => (
            <Step
              key={index}
              title={
                index === 0 
                  ? "Informações Básicas" 
                  : index === 1 
                    ? "Contato" 
                    : "Localização"
              }
              description={
                index === 0 
                  ? "Nome, NIF, Natureza Jurídica" 
                  : index === 1 
                    ? "Endereço, Telefone, Email" 
                    : "Ilha, Concelho, Freguesia"
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

        {!isEditing && activeStep === 0 && (
          <div className="bg-blue-50 p-4 mb-6 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "#028eab" }}
                >
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Proprietário e Gestor (PG)</h3>
                  <p className="text-sm text-gray-600">
                    Esta entidade também atuará como seu proprio gestor?
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="owner-manager" 
                  checked={isPG}
                  onCheckedChange={setIsPG}
                  disabled={isEditing}
                />
                <Label htmlFor="owner-manager" className={isPG ? "text-blue-700 font-medium" : ""}>
                  {isPG ? "Sim" : "Não"}
                </Label>
              </div>
            </div>
            {isPG && (
              <div className="mt-3 text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                <p><strong>Nota:</strong> Esta entidade será registrada como tipo &quot;PG&quot; (Proprietário-Gestor) no sistema.</p>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activeStep === 2) {
                handleSubmit(false);
              } else {
                handleNext();
              }
            }}
            className="space-y-4"
          >
            <div className="mt-6 bg-white p-4 rounded-lg border">
              {activeStep === 0 && <OwnerBasicInfoForm isEditing={isEditing} isPG={isPG} form={form} />}
              {activeStep === 1 && <ContactInfoForm isEditing={isEditing} form={form} />}
              {activeStep === 2 && (
                <GeographicInfoForm 
                  form={form as any} 
                  initialValues={geoInitialValues}
                />
              )}
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

              <div className="flex  gap-3">
                {activeStep < 2 && (
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

                {activeStep === 2 && (
                  <div className="">
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
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
                    
                    {/* {!isEditing && !isPG && (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubmit(isPG ? false : true);
                        }}
                        disabled={isSubmitting}
                        variant="outline"
                        className="px-5 py-2 border-[#028eab] text-[#028eab] hover:bg-[#028eab]/10"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full border-[#028eab]"></div>
                            Processando...
                          </>
                        ) : (
                          <>
                            {isPG ? "Adicionar Proprietário" : "Salvar e Adicionar Gestor "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )} */}
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}