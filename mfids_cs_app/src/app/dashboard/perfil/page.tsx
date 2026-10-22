// Modificações para o ProfilePage.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { toast } from "react-hot-toast";
import { ClientLayout } from "@/components/client-layout";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Home, 
  Save,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useProfileHooks } from "@/hooks/use-profile";
import { ProfileData } from "@/types/type";
import ChangePasswordModal from "@/components/profile/change-password-modal";
import LoadingData from "@/components/loading";

const profileSchema = z.object({
  full_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});


type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { getProfile, updateProfile } = useProfileHooks();
  const { data: profileData, isLoading } = getProfile();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      municipio: "",
      country: "",
      city: "",
      zip_code: "",
      address: "",
      avatar: "",
    },
  });

  useEffect(() => {
    if (profileData?.profile) {
      form.reset({
        full_name: profileData.profile.full_name || "",
        phone: profileData.profile.phone || "",
        municipio: profileData.profile.municipio || "",
        country: profileData.profile.country || "",
        city: profileData.profile.city || "",
        zip_code: profileData.profile.zip_code || "",
        address: profileData.profile.address || "",
        avatar: profileData.profile.avatar || "",
      });
    }
  }, [profileData, form]);

  const onSubmitUpdate = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== "")
      );
      
      await updateProfile(cleanedData as Partial<ProfileData>);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSubmitting(false);
    }
  };
 

  if (isLoading) {
    return (
      <ClientLayout title="Meu Perfil">
        <LoadingData />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Meu Perfil">
      <div className="space-y-6 px-2 sm:px-0">
        <Card className="w-full max-w-4xl mx-auto border shadow-md overflow-hidden">
          <CardHeader className="bg-gray-50 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-white shadow">
                  <AvatarFallback className="bg-[#028eab] text-white text-xl">
                    {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Meu Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </div>
            </div>
            <div className="self-start sm:self-auto">
              <ChangePasswordModal />
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">Informações da Conta</h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nome de Utilizador</p>
                      <p className="font-medium">{profileData?.username || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium break-all">{profileData?.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitUpdate)} className="space-y-6">
                <h3 className="text-lg font-medium mb-2 text-gray-700">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Seu nome completo" 
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Seu número de telefone" 
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <h3 className="text-lg font-medium mb-2 text-gray-700 pt-4">Localização</h3>
                
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="País" 
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Cidade" 
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Município</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Município"
                              disabled
                              readOnly
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Home className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Código Postal" 
                              className="pl-10" 
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="Endereço completo" 
                            className="pl-10" 
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <CardFooter className="px-0 pt-6 flex justify-end border-t">
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: "#028eab" }}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}