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
import { Key, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfileHooks } from "@/hooks/use-profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import toast from "react-hot-toast";

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Senha atual é obrigatória"),
    new_password: z
      .string()
      .min(8, "Nova senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Deve conter pelo menos um número")
      .regex(/[^A-Za-z0-9]/, "Deve conter pelo menos um caractere especial"),
    confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ChangePasswordModalProps {
  triggerComponent?: React.ReactNode;
}

export default function ChangePasswordModal({
  triggerComponent,
}: ChangePasswordModalProps) {
  const { getProfile } = useProfileHooks();
  const { data: profileData } = getProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const { changePassword } = useProfileHooks();
  const [customError, setCustomError] = useState<string | null>(null);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const { formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      setCustomError(null);
      
      await changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
        email: profileData?.email || "",
      });
      
      setIsSuccessful(true);
      
      setTimeout(() => {
        setIsOpen(false);
        
        setTimeout(() => {
          form.reset();
          setIsSuccessful(false);
        }, 300);
      }, 2000);
    } catch (error: any) {
      let errorMessage = "Erro ao atualizar senha.";
      
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (typeof error.response.data === 'object') {
            errorMessage = JSON.stringify(error.response.data, null, 2);
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(
        <div className="max-h-80 overflow-auto">
          <p className="font-bold mb-2">Erro ao atualizar senha:</p>
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
  };

  const watchNewPassword = form.watch("new_password");
  const hasMinLength = watchNewPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(watchNewPassword);
  const hasLowerCase = /[a-z]/.test(watchNewPassword);
  const hasNumber = /[0-9]/.test(watchNewPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(watchNewPassword);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) {
        setIsOpen(open);
        if (!open) {
          setTimeout(() => {
            form.reset();
            setIsSuccessful(false);
            setCustomError(null);
          }, 300);
        }
      }
    }}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button variant="outline">
            <Key className="mr-2 h-4 w-4" /> Alterar Senha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>
            {isSuccessful
              ? "Sua senha foi alterada com sucesso!"
              : "Preencha os campos abaixo para alterar sua senha de acesso."}
          </DialogDescription>
        </DialogHeader>

        {isSuccessful ? (
          <div className="py-6 flex flex-col items-center">
            <div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <p className="text-center">
              Sua senha foi alterada com sucesso. Use a nova senha para acessos futuros.
            </p>
          </div>
        ) : (
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
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua senha atual"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua nova senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    
                    {/* Requisitos de senha */}
                    <div className="mt-2 text-xs space-y-1">
                      <p className="font-medium text-gray-500">A senha deve conter:</p>
                      <ul className="grid grid-cols-2 gap-1">
                        <li className={`flex items-center ${hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasMinLength ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Mínimo 8 caracteres
                        </li>
                        <li className={`flex items-center ${hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasUpperCase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Uma letra maiúscula
                        </li>
                        <li className={`flex items-center ${hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasLowerCase ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Uma letra minúscula
                        </li>
                        <li className={`flex items-center ${hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasNumber ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Um número
                        </li>
                        <li className={`flex items-center ${hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                          {hasSpecialChar ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                          Um caractere especial
                        </li>
                      </ul>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirme sua nova senha"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
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
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}