import { equipmentApi } from "@/services/equipament.service";
import { DomainItem, Equipment, SocialService } from "@/types/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "react-hot-toast";

export const useEquipmentHooks = () => {
  const queryClient = useQueryClient();

  const UseFaixaEtariaByTipoResposta = (tipoResposta: string) => {
  return useQuery<DomainItem[]>({
    queryKey: ["domains", "faixaEtariaTipoResposta", tipoResposta],
    queryFn: () => equipmentApi.getFaixaEtariaByTipoResposta(tipoResposta),
    enabled: !!tipoResposta,
  });
};

  const UseDomainByCode = (domainCode: string) => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", domainCode],
      queryFn: () => equipmentApi.getDomainByCode(domainCode),
    });
  };

  // Hooks para domínios
  const UseEquipmentStatusDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "equipmentStatus"],
      queryFn: equipmentApi.getEquipmentStatusDomain,
    });
  };

  const UseBuildingTypeDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "buildingType"],
      queryFn: equipmentApi.getBuildingTypeDomain,
    });
  };

  const UseConstructionTypeDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "constructionType"],
      queryFn: equipmentApi.getConstructionTypeDomain,
    });
  };

  const UsePropertyRegimeDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "propertyRegime"],
      queryFn: equipmentApi.getPropertyRegimeDomain,
    });
  };

  const UseConservationStateDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "conservationState"],
      queryFn: equipmentApi.getConservationStateDomain,
    });
  };

  const UseWaterTypeDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "waterType"],
      queryFn: equipmentApi.getWaterTypeDomain,
    });
  };

  const UseSanitaryTypeDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "sanitaryType"],
      queryFn: equipmentApi.getSanitaryTypeDomain,
    });
  };

  const UseSewerSystemDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "sewerSystem"],
      queryFn: equipmentApi.getSewerSystemDomain,
    });
  };

  const UseHasKitchenDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "hasKitchen"],
      queryFn: equipmentApi.getHasKitchenDomain,
    });
  };

  const UseTrashCollectionDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "trashCollection"],
      queryFn: equipmentApi.getTrashCollectionDomain,
    });
  };

  const UseFinancingSourceDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "financingSource"],
      queryFn: equipmentApi.getFinancingSourceDomain,
    });
  };

  const UseRemodelingSourceDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "remodelingSource"],
      queryFn: equipmentApi.getRemodelingSourceDomain,
    });
  };

  const UseOperationPeriodDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "operationPeriod"],
      queryFn: equipmentApi.getOperationPeriodDomain,
    });
  };

  const UseOperationDaysDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "operationDays"],
      queryFn: equipmentApi.getOperationDaysDomain,
    });
  };

  const UseMonthsDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "months"],
      queryFn: equipmentApi.getMonthsDomain,
    });
  };

  const UseServiceTypesDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "serviceTypes"],
      queryFn: equipmentApi.getServiceTypesDomain,
    });
  };

  const UseServicePrestationDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "servicePrestation"],
      queryFn: equipmentApi.getServicePrestationDomain,
    });
  };

  const UseServiceFinancingDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "serviceFinancing"],
      queryFn: equipmentApi.getServiceFinancingDomain,
    });
  };

  const UseServiceAccessDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "serviceAccess"],
      queryFn: equipmentApi.getServiceAccessDomain,
    });
  };

  const UseServiceFaixaEtariaDomain = () => {
    return useQuery<DomainItem[]>({
      queryKey: ["domains", "serviceFaixaEtaria"],
      queryFn: equipmentApi.getServiceFaixaEtariaDomain,
    });
  };

  // Hooks para equipamentos
  const UseGetEquipments = () => {
    return useQuery<Equipment[]>({
      queryKey: ["equipments"],
      queryFn: equipmentApi.getEquipments,
    });
  };

  const UseGetEquipmentById = (id: number) => {
    return useQuery<Equipment>({
      queryKey: ["equipment", id],
      queryFn: () => equipmentApi.getEquipmentById(id),
      enabled: !!id,
    });
  };

  const UseCreateEquipment = () => {
    return useMutation({
      mutationFn: (data: Equipment) => equipmentApi.createEquipment(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["equipments"] });
        toast.success("Equipamento criado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao criar equipamento:", error);
        toast.error(error.message || "Erro ao criar equipamento");
      },
    });
  };

  const UseUpdateEquipment = () => {
    return useMutation({
      mutationFn: (data: Equipment) => equipmentApi.updateEquipment(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["equipments"] });
        toast.success("Equipamento atualizado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao atualizar equipamento:", error);
        toast.error(error.message || "Erro ao atualizar equipamento");
      },
    });
  };

  const UseDeleteEquipment = () => {
    return useMutation({
      mutationFn: (id: number) => equipmentApi.deleteEquipment(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["equipments"] });
        toast.success("Equipamento excluído com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao excluir equipamento:", error);
        toast.error(error.message || "Erro ao excluir equipamento");
      },
    });
  };

  // Hooks para valências/respostas sociais
  const UseGetSocialServices = () => {
    return useQuery<SocialService[]>({
      queryKey: ["socialServices"],
      queryFn: equipmentApi.getSocialServices,
    });
  };

  const UseGetSocialServicesByEquipment = (equipmentId: number) => {
    return useQuery<SocialService[]>({
      queryKey: ["socialServices", "equipment", equipmentId],
      queryFn: () => equipmentApi.getSocialServicesByEquipment(equipmentId),
      enabled: !!equipmentId,
    });
  };

  const UseGetSocialServiceById = (id: number) => {
    return useQuery<SocialService>({
      queryKey: ["socialService", id],
      queryFn: () => equipmentApi.getSocialServiceById(id),
      enabled: !!id,
    });
  };

  const UseCreateSocialService = () => {
    return useMutation({
      mutationFn: (data: SocialService) => equipmentApi.createSocialService(data),
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
      mutationFn: (data: SocialService) => equipmentApi.updateSocialService(data),
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
      mutationFn: (id: number) => equipmentApi.deleteSocialService(id),
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

  // Preparando mutações para uso mais simples
  const createEquipmentMutation = UseCreateEquipment();
  const updateEquipmentMutation = UseUpdateEquipment();
  const deleteEquipmentMutation = UseDeleteEquipment();
  const createSocialServiceMutation = UseCreateSocialService();
  const updateSocialServiceMutation = UseUpdateSocialService();
  const deleteSocialServiceMutation = UseDeleteSocialService();

  return {
    // Domínios
    getEquipmentStatusDomain: UseEquipmentStatusDomain,
    getBuildingTypeDomain: UseBuildingTypeDomain,
    getConstructionTypeDomain: UseConstructionTypeDomain,
    getPropertyRegimeDomain: UsePropertyRegimeDomain,
    getConservationStateDomain: UseConservationStateDomain,
    getWaterTypeDomain: UseWaterTypeDomain,
    getSanitaryTypeDomain: UseSanitaryTypeDomain,
    getSewerSystemDomain: UseSewerSystemDomain,
    getHasKitchenDomain: UseHasKitchenDomain,
    getTrashCollectionDomain: UseTrashCollectionDomain,
    getFinancingSourceDomain: UseFinancingSourceDomain,
    getRemodelingSourceDomain: UseRemodelingSourceDomain,
    getOperationPeriodDomain: UseOperationPeriodDomain,
    getOperationDaysDomain: UseOperationDaysDomain,
    getMonthsDomain: UseMonthsDomain,
    getServiceTypesDomain: UseServiceTypesDomain,
    getServicePrestationDomain: UseServicePrestationDomain,
    getServiceFinancingDomain: UseServiceFinancingDomain,
    getServiceAccessDomain: UseServiceAccessDomain,
    getServiceFaixaEtariaDomain: UseServiceFaixaEtariaDomain,
     getFaixaEtariaByTipoResposta: UseFaixaEtariaByTipoResposta,
    getDomainByCode: UseDomainByCode,
    
    // Equipamentos
    getEquipments: UseGetEquipments,
    getEquipmentById: UseGetEquipmentById,
    createEquipment: (data: Equipment) => createEquipmentMutation.mutateAsync(data),
    updateEquipment: (data: Equipment) => updateEquipmentMutation.mutateAsync(data),
    deleteEquipment: (id: number) => deleteEquipmentMutation.mutateAsync(id),
    
    // Valências/respostas sociais
    getSocialServices: UseGetSocialServices,
    getSocialServicesByEquipment: UseGetSocialServicesByEquipment,
    getSocialServiceById: UseGetSocialServiceById,
    createSocialService: (data: SocialService) => createSocialServiceMutation.mutateAsync(data),
    updateSocialService: (data: SocialService) => updateSocialServiceMutation.mutateAsync(data),
    deleteSocialService: (id: number) => deleteSocialServiceMutation.mutateAsync(id),
  };
};