import { api } from "@/lib/api";
import { DomainItem, Manager, Owner } from "@/types/type";

export const organizationApi = {
  // Domínios e tipos
  getLegalNatures: async (): Promise<DomainItem[]> => {
    try {
      const response = await api.get('/dominios', {
        params: { domain_name: 'NAT_JURIDICA_EP' }
      });
      return response.data;
    } catch {
      return [];
    }
  },

  getOwners: async (): Promise<Owner[]> => {
    try {
      const response = await api.get('/organizacoes/proprietarios');
      return response.data;
    } catch {
      return [];
    }
  },

  getOwnerById: async (id: number): Promise<Owner> => {
    const response = await api.get(`/organizacoes/${id}`);
    return response.data;
  },

  createOwner: async (ownerData: Owner): Promise<Owner> => {
    try {
      const data = {
        ...ownerData,
        parent_id: 0, 
        geografia: typeof ownerData.geografia === 'object' && ownerData.geografia !== null
          ? ownerData.geografia.id
          : ownerData.geografia
      };
      
      const response = await api.post('/organizacoes', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateOwner: async (owner: Owner): Promise<Owner> => {
    const response = await api.patch(`/organizacoes/${owner.id}`, owner);
    return response.data;
  },

  deleteOwner: async (id: number): Promise<void> => {
    await api.delete(`/organizacoes/${id}`);
  },

  getManagers: async (): Promise<Manager[]> => {
    try {
      const response = await api.get('/organizacoes/gestores');
      return response.data;
    } catch {
      return [];
    }
  },

  getManagersByOwner: async (ownerId: number): Promise<Manager[]> => {
    try {
      const response = await api.get(`/organizacoes/${ownerId}`);
      return response.data.gestor || [];
    } catch {
      return [];
    }
  },

  getManagerById: async (id: number): Promise<Manager> => {
    const response = await api.get(`/organizacoes/${id}`);
    return response.data;
  },

  createManager: async (managerData: Manager): Promise<Manager> => {
    try {
      const response = await api.post('/organizacoes', managerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateManager: async (manager: Manager): Promise<Manager> => {
    const response = await api.put(`/organizacoes/${manager.id}`, manager);
    return response.data;
  },

  deleteManager: async (id: number): Promise<void> => {
    await api.delete(`/organizacoes/${id}`);
  }
};

export const useOrganization = () => {
  return {
    getLegalNatures: organizationApi.getLegalNatures,
    getOwners: organizationApi.getOwners,
    getOwnerById: organizationApi.getOwnerById,
    createOwner: organizationApi.createOwner,
    updateOwner: organizationApi.updateOwner,
    deleteOwner: organizationApi.deleteOwner,
    getManagers: organizationApi.getManagers,
    getManagersByOwner: organizationApi.getManagersByOwner,
    getManagerById: organizationApi.getManagerById,
    createManager: organizationApi.createManager,
    updateManager: organizationApi.updateManager,
    deleteManager: organizationApi.deleteManager
  };
};