"use client";

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
import { LoaderIcon, LockKeyhole, User, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import logoImage from '../../public/logo-site.png'
import PasswordResetForm from "./profile/password-reset-form";

const loginSchema = z.object({
  email: z.string().min(1, "Campo é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch {
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-1 md:p-4">
        <div className="flex justify-center py-6">
          <Image src={logoImage} alt="Logo" width={300} height={100} />
        </div>
        
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-2" style={{ backgroundColor: "#028eab" }}></div>
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-xl md:text-xl font-bold text-center">
              Sistema de Gestão
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email ou Utilizador</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="Insira o seu email ou utilizador" 
                            className="pl-10 py-6 border-gray-300 focus:border-[#028eab] focus:ring focus:ring-[#028eab] focus:ring-opacity-20" 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Senha</FormLabel>
                     
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockKeyhole className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Insira sua senha"
                            className="pl-10 py-6 border-gray-300 focus:border-[#028eab] focus:ring focus:ring-[#028eab] focus:ring-opacity-20"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg font-medium transition-all duration-200"
                  style={{ backgroundColor: "#028eab" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <LoaderIcon className="mr-2 h-5 w-5 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <LogIn className="mr-2 h-5 w-5" /> 
                      <span>Entrar</span>
                    </div>
                  )}
                </Button>

                
              </form>
            </Form>
            <div className="flex items-center justify-center">
                <PasswordResetForm />
                </div>
          </CardContent>
          
          <CardFooter className="flex text-center justify-center text-sm text-gray-500 pb-6">
            <p>© 2025 Sistema de Gestão - Todos os direitos reservados</p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato com o suporte
          </p>
          <p className="text-sm font-medium mt-1" style={{ color: "#028eab" }}>
            suporte@sistemagestao.com
          </p>
        </div>
      </div>
    </div>
  );
}