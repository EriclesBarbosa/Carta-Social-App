import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "@/services/organization.service";
import { toast } from "react-hot-toast";
import { Manager, Owner } from "@/types/type";

export const useOrganizationHooks = () => {
  const queryClient = useQueryClient();

  const UseLegalNatures = () => {
    return useQuery({
      queryKey: ["legalNatures"],
      queryFn: organizationApi.getLegalNatures,
    });
  };

  const UseGetOwners = () => {
    return useQuery({
      queryKey: ["owners"],
      queryFn: organizationApi.getOwners,
    });
  };

  const UseGetOwnerById = (id: number) => {
    return useQuery({
      queryKey: ["owner", id],
      queryFn: () => organizationApi.getOwnerById(id),
      enabled: !!id,
    });
  };

  const UseCreateOwner = () => {
    return useMutation({
      mutationFn: (data: Owner) => organizationApi.createOwner(data as any),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        toast.success("Proprietário criado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao criar proprietário:", error);
        toast.error(error.message || "Erro ao criar proprietário");
      },
    });
  };

  const UseUpdateOwner = () => {
    return useMutation({
      mutationFn: (data: Owner) => organizationApi.updateOwner(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        toast.success("Proprietário atualizado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao atualizar proprietário:", error);
        toast.error(error.message || "Erro ao atualizar proprietário");
      },
    });
  };

  const UseDeleteOwner = () => {
    return useMutation({
      mutationFn: (id: number) => organizationApi.deleteOwner(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        toast.success("Proprietário excluído com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao excluir proprietário:", error);
        toast.error(error.message || "Erro ao excluir proprietário");
      },
    });
  };

  // Queries para gestores
  const UseGetManagers = () => {
    return useQuery({
      queryKey: ["managers"],
      queryFn: organizationApi.getManagers,
    });
  };

  const UseGetManagersByOwner = (ownerId: number) => {
    return useQuery({
      queryKey: ["managers", "owner", ownerId],
      queryFn: () => organizationApi.getManagersByOwner(ownerId),
      enabled: !!ownerId,
    });
  };

  const UseGetManagerById = (id: number) => {
    return useQuery({
      queryKey: ["manager", id],
      queryFn: () => organizationApi.getManagerById(id),
      enabled: !!id,
    });
  };

  // Mutations para gestores
  const UseCreateManager = () => {
    return useMutation({
      mutationFn: (data: Manager) => organizationApi.createManager(data as any),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["managers"] });
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        queryClient.invalidateQueries({ queryKey: ["owner", variables.parent_id] });
        toast.success("Gestor criado com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao criar gestor:", error);
        toast.error(error.message || "Erro ao criar gestor");
      },
    });
  };

  const UseUpdateManager = () => {
    return useMutation({
      mutationFn: (data: Manager) => organizationApi.updateManager(data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ["managers"] });
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        queryClient.invalidateQueries({ queryKey: ["owner", variables.parent_id] });
      },
      onError: (error: any) => {
        console.error("Erro ao atualizar gestor:", error);
        toast.error(error.message || "Erro ao atualizar gestor");
      },
    });
  };

  const UseDeleteManager = () => {
    return useMutation({
      mutationFn: (id: number) => organizationApi.deleteManager(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["managers"] });
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        toast.success("Gestor excluído com sucesso!");
      },
      onError: (error: any) => {
        console.error("Erro ao excluir gestor:", error);
        toast.error(error.message || "Erro ao excluir gestor");
      },
    });
  };

  const createOwnerMutation = UseCreateOwner();
  const updateOwnerMutation = UseUpdateOwner();
  const deleteOwnerMutation = UseDeleteOwner();
  const createManagerMutation = UseCreateManager();
  const updateManagerMutation = UseUpdateManager();
  const deleteManagerMutation = UseDeleteManager();

  return {
    // Queries e mutations para domínios e tipos
    getLegalNatures: UseLegalNatures,
    
    // Queries e mutations para proprietários
    getOwners: UseGetOwners,
    getOwnerById: UseGetOwnerById,
    createOwner: (data: Owner) => createOwnerMutation.mutateAsync(data),
    updateOwner: (data: Owner) => updateOwnerMutation.mutateAsync(data),
    deleteOwner: (id: number) => deleteOwnerMutation.mutateAsync(id),
    
    // Queries e mutations para gestores
    getManagers: UseGetManagers,
    getManagersByOwner: UseGetManagersByOwner,
    getManagerById: UseGetManagerById,
    createManager: (data: Manager) => createManagerMutation.mutateAsync(data),
    updateManager: (data: Manager) => updateManagerMutation.mutateAsync(data),
    deleteManager: (id: number) => deleteManagerMutation.mutateAsync(id),
  };
};