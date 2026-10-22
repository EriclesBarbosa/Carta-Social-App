import { profileApi } from "@/services/profile.service";
import { ProfileData } from "@/types/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export const useProfileHooks = () => {
  const queryClient = useQueryClient();

  const UseGetProfile = () => {
    return useQuery<ProfileData>({
      queryKey: ["profile"],
      queryFn: profileApi.getProfile,
    });
  };

  const UseUpdateProfile = () => {
    return useMutation({
      mutationFn: (data: Partial<ProfileData>) => profileApi.updateProfile(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast.success("Perfil atualizado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao atualizar perfil:", error);
        toast.error(error.message || "Erro ao atualizar perfil");
      },
    });
  };

  const UseChangePassword = () => {
    return useMutation({
      mutationFn: (data: { old_password: string; new_password: string, confirm_password: string, email: string }) => 
        profileApi.changePassword(data),
      onSuccess: () => {
        toast.success("Senha alterada com sucesso!");
      }
    });
  };

  const UseRequestPasswordReset = () => {
    return useMutation({
      mutationFn: (email: string) => profileApi.requestPasswordReset(email),
      onSuccess: () => {
        toast.success("E-mail de recuperação enviado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao solicitar redefinição de senha:", error);
        toast.error(
          error.response?.data?.detail || 
          "Erro ao solicitar redefinição de senha. Tente novamente."
        );
      },
    });
  };

  const UseConfirmPasswordReset = () => {
    return useMutation({
      mutationFn: (data: { 
        uid: string; 
        token: string; 
        new_password: string; 
        confirm_password: string;
        old_password?: string
      }) => 
        profileApi.confirmPasswordReset(
          data.uid, 
          data.token, 
          { 
            new_password: data.new_password, 
            confirm_password: data.confirm_password,
          }
        ),
      onSuccess: () => {
        toast.success("Senha redefinida com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao redefinir senha:", error);
        if (error.response?.data?.token?.[0] === "Invalid token") {
          toast.error("Token inválido ou expirado. Solicite um novo link de redefinição.");
        } else {
          toast.error(
            error.response?.data?.detail ||
            "Erro ao redefinir senha. Tente novamente."
          );
        }
      },
    });
  };

  const updateProfileMutation = UseUpdateProfile();
  const changePasswordMutation = UseChangePassword();
  const requestPasswordResetMutation = UseRequestPasswordReset();
  const confirmPasswordResetMutation = UseConfirmPasswordReset();

  return {
    getProfile: UseGetProfile,
    updateProfile: (data: Partial<ProfileData>) => updateProfileMutation.mutateAsync(data),
    changePassword: (data: { old_password: string; new_password: string, confirm_password: string, email: string }) => 
      changePasswordMutation.mutateAsync(data),
    requestPasswordReset: (email: string) => requestPasswordResetMutation.mutateAsync(email),
    confirmPasswordReset: (data: { 
      uid: string; 
      token: string; 
      new_password: string; 
      confirm_password: string 
    }) => confirmPasswordResetMutation.mutateAsync(data),
  };
};