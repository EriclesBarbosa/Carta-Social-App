import { api } from "@/lib/api";
import { SocialService } from "@/types/type";

export const socialServiceApi = {
  getSocialServices: async (): Promise<SocialService[]> => {
    try {
      const response = await api.get('/servicos');
      return response.data;
    } catch {
      return [];
    }
  },

  getSocialServiceById: async (id: number): Promise<SocialService> => {
    const response = await api.get(`/servicos/${id}`);
    return response.data;
  },

  getSocialServicesByEquipment: async (equipmentId: number): Promise<SocialService[]> => {
    try {
      const response = await api.get(`/equipamentos/${equipmentId}/servicos`);
      return response.data;
    } catch {
      return [];
    }
  },

  createSocialService: async (serviceData: SocialService): Promise<SocialService> => {
    try {
      const response = await api.post('/servicos', serviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSocialService: async (serviceData: SocialService): Promise<SocialService> => {
    try {
      const response = await api.put(`/servicos/${serviceData.id}`, serviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteSocialService: async (id: number): Promise<void> => {
    try {
      await api.delete(`/servicos/${id}`);
    } catch (error) {
      throw error;
    }
  }
};

export const useSocialService = () => {
  return {
    getSocialServices: socialServiceApi.getSocialServices,
    getSocialServiceById: socialServiceApi.getSocialServiceById,
    getSocialServicesByEquipment: socialServiceApi.getSocialServicesByEquipment,
    createSocialService: socialServiceApi.createSocialService,
    updateSocialService: socialServiceApi.updateSocialService,
    deleteSocialService: socialServiceApi.deleteSocialService
  };
};