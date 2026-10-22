"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Key, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useProfileHooks } from "@/hooks/use-profile";

const passwordResetSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirm_password: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

export default function PasswordResetConfirmPage() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const { confirmPasswordReset } = useProfileHooks();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: PasswordResetFormValues) => {
    if (!uid || !token) {
      return;
    }

    try {
      setIsSubmitting(true);

      await confirmPasswordReset({
        uid,
        token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      setResetComplete(true);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="mb-8">
          <Image src={'/logo-site.png'} alt="Logo" width={200} height={60} />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl md:text-xl font-bold text-center">
              Link Inválido
            </CardTitle>
            <CardDescription className="text-center">
              O link de redefinição de senha é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="p-3 bg-red-100 text-red-700 rounded-full mb-4">
              <Key className="h-6 w-6" />
            </div>
            <p className="text-center mb-6">
              Por favor, solicite um novo link de redefinição de senha.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full" style={{ backgroundColor: "#028eab" }}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="mb-8">
        <Image src={'/logo-site.png'} alt="Logo" width={200} height={60} />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-xl font-bold text-center">
            {resetComplete ? "Senha Redefinida" : "Criar Nova Senha"}
          </CardTitle>
          <CardDescription className="text-center">
            {resetComplete
              ? "Sua senha foi alterada com sucesso."
              : "Insira sua nova senha para concluir a redefinição."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resetComplete ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Sua nova senha"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirme a Senha</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirme sua nova senha"
                            className="pl-10"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-6"
                  style={{ backgroundColor: "#028eab" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></div>
                      Processando...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-full mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-center mb-6">
                Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
              </p>
            </div>
          )}
        </CardContent>
        {resetComplete && (
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button
                className="w-full"
                style={{ backgroundColor: "#028eab" }}
              >
                Ir para o Login
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}