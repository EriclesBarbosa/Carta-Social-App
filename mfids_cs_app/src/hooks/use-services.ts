
import { socialServiceApi } from "@/services/service.service";
import { SocialService } from "@/types/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-hot-toast";

export const useSocialServiceHooks = () => {
  const queryClient = useQueryClient();
  
  // Hooks para valências/respostas sociais
  const UseGetSocialServices = () => {
    return useQuery<SocialService[]>({
      queryKey: ["socialServices"],
      queryFn: socialServiceApi.getSocialServices,
    });
  };

  const UseGetSocialServicesByEquipment = (equipmentId: number) => {
    return useQuery<SocialService[]>({
      queryKey: ["socialServices", "equipment", equipmentId],
      queryFn: () => socialServiceApi.getSocialServicesByEquipment(equipmentId),
      enabled: !!equipmentId,
    });
  };

  const UseGetSocialServiceById = (id: number) => {
    return useQuery<SocialService>({
      queryKey: ["socialService", id],
      queryFn: () => socialServiceApi.getSocialServiceById(id),
      enabled: !!id,
    });
  };

  const UseCreateSocialService = () => {
    return useMutation({
      mutationFn: (data: SocialService) => socialServiceApi.createSocialService(data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["socialServices"] });
        queryClient.invalidateQueries({ queryKey: ["socialServices", "equipment", variables.equipamento] });
        toast.success("Serviço social criado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao criar valências/respostas sociais:", error);
        toast.error(error.message || "Erro ao criar valências/respostas sociais");
      },
    });
  };

  const UseUpdateSocialService = () => {
    return useMutation({
      mutationFn: (data: SocialService) => socialServiceApi.updateSocialService(data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["socialServices"] });
        queryClient.invalidateQueries({ queryKey: ["socialServices", "equipment", variables.equipamento] });
        queryClient.invalidateQueries({ queryKey: ["socialService", variables.id] });
        toast.success("Serviço social atualizado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao atualizar valências/respostas sociais:", error);
        toast.error(error.message || "Erro ao atualizar valências/respostas sociais");
      },
    });
  };

  const UseDeleteSocialService = () => {
    return useMutation({
      mutationFn: (id: number) => socialServiceApi.deleteSocialService(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["socialServices"] });
        toast.success("Serviço social excluído com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao excluir valências/respostas sociais:", error);
        toast.error(error.message || "Erro ao excluir valências/respostas sociais");
      },
    });
  };

  const createSocialServiceMutation = UseCreateSocialService();
  const updateSocialServiceMutation = UseUpdateSocialService();
  const deleteSocialServiceMutation = UseDeleteSocialService();

  return {
    getSocialServices: UseGetSocialServices,
    getSocialServicesByEquipment: UseGetSocialServicesByEquipment,
    getSocialServiceById: UseGetSocialServiceById,
    createSocialService: (data: SocialService) => createSocialServiceMutation.mutateAsync(data),
    updateSocialService: (data: SocialService) => updateSocialServiceMutation.mutateAsync(data),
    deleteSocialService: (id: number) => deleteSocialServiceMutation.mutateAsync(id),
  };
};