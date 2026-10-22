"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, ArrowLeft, Save, User, Phone, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { ManagerFormValues } from "@/lib/schemas/organization-schema";
import { Step, Stepper } from "@/components/stepper/stepper";
import { ManagerBasicInfoForm } from "./steps/ManagerBasicInfoForm";
import { ContactInfoForm } from "./steps/ContactInfoForm";
import { GeographicInfoForm } from "./steps/GeographicInfoForm";
import { validateStep } from "@/lib/validations";
import { Manager, Owner } from "@/types/type";

interface ManagerFormStepperProps {
  owner: Owner;
  onComplete: (data: Manager) => void;
  onFinish: () => void;
  initialValues?: Partial<Manager>;
  isEditing?: boolean;
}

export function ManagerFormStepper({
  owner,
  onComplete,
  onFinish,
  initialValues,
  isEditing = false,
}: ManagerFormStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(undefined as any),
    defaultValues: {
      nome: initialValues?.nome || "",
      nif: initialValues?.nif || "",
      natureza_juridica: initialValues?.natureza_juridica || "",
      tipo_organizacao: "G",
      contato: {
        endereco:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.endereco
            : "",
        caixa_postal:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.caixa_postal
            : "",
        telefone:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.telefone
            : "",
        telemovel:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.telemovel
            : "",
        email:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.email
            : "",
        website:
          typeof initialValues?.contato === "object"
            ? initialValues?.contato?.website
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

  const geoInitialValues = typeof initialValues?.geografia === 'object' ? {
    ilha: initialValues.geografia.ilha,
    concelho: initialValues.geografia.concelho,
    freguesia: initialValues.geografia.freguesia,
    zona: initialValues.geografia.zona,
    lugar: initialValues.geografia.lugar,
  } : undefined;

  useEffect(() => {
    form.clearErrors();
    setFormError(null);
  }, [activeStep, form]);
  
  const handleNext = async () => {
    form.clearErrors();
    setFormError(null);

    const isValid = await validateStep(activeStep, form, setFormError);
    
    if (isValid) {
      setActiveStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (action: "save" | "add-another" | "finish") => {
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
      const geografiaId: any = formValues?.geografia.id;
      console.log("Geografia ID:", geografiaId);

      const managerData: Manager = {
        nome: formValues.nome,
        nif: formValues.nif,
        natureza_juridica: formValues.natureza_juridica,
        tipo_organizacao: "G",
        parent_id: owner.id as number,
        contato: formValues.contato,
        geografia: parseInt(geografiaId),
      };

      if (isEditing && initialValues?.id) {
        managerData.id = initialValues.id;
      }
      
      await onComplete(managerData);

      if (action === "finish") {
        onFinish();
      }
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      setFormError(error.message || "Erro ao enviar o formulário");
      toast.error("Erro ao salvar gestor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full  mx-auto">
      <CardHeader></CardHeader>
      <CardContent>
        <Stepper activeStep={activeStep} className="mb-8">
          <Step
            title="Informações Básicas"
            description="Nome, NIF, Natureza Jurídica"
            icon={<User className="h-4 w-4" />}
            index={0}
          />
          <Step
            title="Contato"
            description="Endereço, Telefone, Email"
            icon={<Phone className="h-4 w-4" />}
            index={1}
          />
          <Step
            title="Localização"
            description="Ilha, Concelho, Freguesia"
            icon={<MapPin className="h-4 w-4" />}
            index={2}
          />
        </Stepper>

        <Form {...form}>
          <form className="space-y-4">
            <div className="mt-6">
              {activeStep === 0 && (<ManagerBasicInfoForm isEditing={isEditing} form={form} ownerName={owner.nome} />)}
              {activeStep === 1 && <ContactInfoForm isEditing={isEditing} form={form} />}
              {activeStep === 2 && <GeographicInfoForm form={form as any} initialValues={geoInitialValues} />}
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>

              <div className="flex gap-2">
                {activeStep < 2 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    style={{ backgroundColor: "#028eab" }}
                  >
                    Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    
                    {!isEditing ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => handleSubmit("finish")}
                          disabled={isSubmitting}
                          style={{ backgroundColor: "#028eab" }}
                        >
                          Finalizar
                        </Button>
                      </>
                    ) : (
                      <Button
                      type="button"
                      onClick={() => handleSubmit("save")}
                      disabled={isSubmitting}
                      style={{ backgroundColor: "#028eab" }}
                    >
                      <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Salvando..." : "Salvar"}
                    </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
