"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Undo2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfileHooks } from "@/hooks/use-profile";
import { Alert, AlertDescription } from "@/components/ui/alert";

const resetSchema = z.object({
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  triggerComponent?: React.ReactNode;
  onDialogClose?: () => void;
}

export default function PasswordResetForm({
  triggerComponent,
  onDialogClose,
}: PasswordResetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { requestPasswordReset } = useProfileHooks();
  const [customError, setCustomError] = useState<string | null>(null);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (data: ResetFormValues) => {
    try {
      setCustomError(null);

      await requestPasswordReset(data.email);

      setResetSent(true);
    } catch (error: any) {
      if (error.response?.data?.email) {
        form.setError("email", {
          message: error.response.data.email[0],
        });
      } else if (error.response?.data?.detail) {
        setCustomError(error.response.data.detail);
      } else {
        setCustomError("Erro ao solicitar redefinição de senha. Tente novamente.");
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    
    if (onDialogClose) {
      onDialogClose();
    }
    
    setTimeout(() => {
      setResetSent(false);
      setCustomError(null);
      form.reset();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) {
        setIsOpen(open);
        if (!open) {
          setTimeout(() => {
            setResetSent(false);
            setCustomError(null);
            form.reset();
          }, 300);
          
          if (onDialogClose) {
            onDialogClose();
          }
        }
      }
    }}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button variant="link" className="text-sm text-gray-500 hover:text-gray-700 px-0">
            Esqueceu sua senha?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recuperação de Senha</DialogTitle>
          <DialogDescription>
            {!resetSent
              ? "Insira seu e-mail para receber instruções de recuperação de senha."
              : "Um e-mail com instruções para redefinir sua senha foi enviado."}
          </DialogDescription>
        </DialogHeader>

        {!resetSent ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              {customError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{customError}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Seu e-mail de cadastro"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#028eab" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></div>
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="bg-green-100 text-green-800 p-4 rounded-full mb-4">
              <Mail className="h-10 w-10" />
            </div>
            <p className="text-center mb-4">
              Verifique sua caixa de entrada e siga as instruções enviadas para{" "}
              <span className="font-medium">{form.getValues().email}</span>.
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              Caso não encontre o e-mail, verifique sua pasta de spam ou lixo eletrônico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetSent(false);
                  form.reset();
                }}
                className="flex-1"
              >
                Tentar novamente
              </Button>
              <Button
                type="button"
                style={{ backgroundColor: "#028eab" }}
                onClick={handleClose}
                className="flex-1"
              >
                <Undo2 className="mr-2 h-4 w-4" /> Voltar ao Login
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}