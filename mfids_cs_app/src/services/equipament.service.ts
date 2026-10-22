import { api } from "@/lib/api";
import { Equipment, SocialService, DomainItem } from "@/types/type";

export const equipmentApi = {
  // Domínios relacionados a equipamentos
  getDomainByCode: async (domainCode: string): Promise<DomainItem[]> => {
    try {
      const response = await api.get('/dominios', {
        params: { domain_name: domainCode }
      });
      return response.data;
    } catch {
      return [];
    }
  },

   getFaixaEtariaByTipoResposta: async (tipoResposta: string): Promise<DomainItem[]> => {
    try {
      const response = await api.post('/dominios/tipo_faixa_etaria', {
        tipo_resposta: tipoResposta
      });
      return response.data;
    } catch {
      return [];
    }
  },
  
  getEquipmentStatusDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('SITUACAO_EQ');
  },

  getBuildingTypeDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('TIPO_EDIFICACAO');
  },

  getConstructionTypeDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('TIPO_CONSTRUCAO');
  },

  getPropertyRegimeDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('REG_PROPRIEDADE');
  },

  getConservationStateDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('AVAL_ESTADO_CONSERV');
  },

  getWaterTypeDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('LIGACAO_REDE_PUBLICA');
  },

  getSanitaryTypeDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('SANITA_LATRINA');
  },

  getSewerSystemDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('SISTEMA_EVAQUACAO');
  },

  getHasKitchenDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('EQ_COZINHA');
  },

  getTrashCollectionDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('TIPO_LIXO');
  },

  getFinancingSourceDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('FONTE_FIN_CONSTRUCAO');
  },

  getRemodelingSourceDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('FONTE_FIN_REMODELACAO');
  },

  // Domínios relacionados a valências/respostas sociais
  getOperationPeriodDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('PER_FUNCIONAMENTO');
  },

  getOperationDaysDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('DIA_FUNCIONAMENTO');
  },

  getMonthsDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('MESES');
  },

  getServiceTypesDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('TIPO_RESPOSTA_SOCIAL');
  },

  getServicePrestationDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('SERV_PRESTADOS');
  },

  getServiceFinancingDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('FONT_FIN_FUNCIONAMENTO');
  },

  getServiceAccessDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('ACESSO_VAL');
  },

  getServiceFaixaEtariaDomain: async (): Promise<DomainItem[]> => {
    return equipmentApi.getDomainByCode('FAIXA_ETARIA');
  },

  // CRUD Equipamentos
  getEquipments: async (): Promise<Equipment[]> => {
    try {
      const response = await api.get('/equipamentos');
      return response.data;
    } catch {
      return [];
    }
  },

  getEquipmentById: async (id: number): Promise<Equipment> => {
    const response = await api.get(`/equipamentos/${id}`);
    return response.data;
  },

  createEquipment: async (equipmentData: Equipment): Promise<Equipment> => {
    try {
      const response = await api.post('/equipamentos', equipmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateEquipment: async (equipmentData: Equipment): Promise<Equipment> => {
    try {
      const response = await api.put(`/equipamentos/${equipmentData.id}`, equipmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteEquipment: async (id: number): Promise<void> => {
    try {
      await api.delete(`/equipamentos/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // CRUD Valências/respostas sociais
  getSocialServices: async (): Promise<SocialService[]> => {
    try {
      const response = await api.get('/servicos');
      return response.data;
    } catch {
      return [];
    }
  },

  getSocialServicesByEquipment: async (equipmentId: number): Promise<SocialService[]> => {
    try {
      const response = await api.get(`/equipamentos/${equipmentId}/servicos`);
      return response.data;
    } catch {
      return [];
    }
  },

  getSocialServiceById: async (id: number): Promise<SocialService> => {
    const response = await api.get(`/servicos/${id}`);
    return response.data;
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

export const useEquipment = () => {
  return {
    // Domínios
    getEquipmentStatusDomain: equipmentApi.getEquipmentStatusDomain,
    getBuildingTypeDomain: equipmentApi.getBuildingTypeDomain,
    getConstructionTypeDomain: equipmentApi.getConstructionTypeDomain,
    getPropertyRegimeDomain: equipmentApi.getPropertyRegimeDomain,
    getConservationStateDomain: equipmentApi.getConservationStateDomain,
    getWaterTypeDomain: equipmentApi.getWaterTypeDomain,
    getSanitaryTypeDomain: equipmentApi.getSanitaryTypeDomain,
    getSewerSystemDomain: equipmentApi.getSewerSystemDomain,
    getHasKitchenDomain: equipmentApi.getHasKitchenDomain,
    getTrashCollectionDomain: equipmentApi.getTrashCollectionDomain,
    getFinancingSourceDomain: equipmentApi.getFinancingSourceDomain,
    getRemodelingSourceDomain: equipmentApi.getRemodelingSourceDomain,
    getOperationPeriodDomain: equipmentApi.getOperationPeriodDomain,
    getOperationDaysDomain: equipmentApi.getOperationDaysDomain,
    getMonthsDomain: equipmentApi.getMonthsDomain,
    getServiceTypesDomain: equipmentApi.getServiceTypesDomain,
    getServicePrestationDomain: equipmentApi.getServicePrestationDomain,
    getServiceFinancingDomain: equipmentApi.getServiceFinancingDomain,
    getServiceAccessDomain: equipmentApi.getServiceAccessDomain,
    getServiceFaixaEtariaDomain: equipmentApi.getServiceFaixaEtariaDomain,
    getFaixaEtariaByTipoResposta: equipmentApi.getFaixaEtariaByTipoResposta,
    getDomainByCode: equipmentApi.getDomainByCode,
    
    // Equipamentos
    getEquipments: equipmentApi.getEquipments,
    getEquipmentById: equipmentApi.getEquipmentById,
    createEquipment: equipmentApi.createEquipment,
    updateEquipment: equipmentApi.updateEquipment,
    deleteEquipment: equipmentApi.deleteEquipment,
    
    // Valências/respostas sociais
    getSocialServices: equipmentApi.getSocialServices,
    getSocialServicesByEquipment: equipmentApi.getSocialServicesByEquipment,
    getSocialServiceById: equipmentApi.getSocialServiceById,
    createSocialService: equipmentApi.createSocialService,
    updateSocialService: equipmentApi.updateSocialService,
    deleteSocialService: equipmentApi.deleteSocialService
  };
};