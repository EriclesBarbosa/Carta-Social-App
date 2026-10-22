import { api } from "@/lib/api";
import { GeographicItem } from "@/types/type";

export const geographyApi = {
  getIslands: async (): Promise<GeographicItem[]> => {
    try {
      const response = await api.get('/geografia/ilhas');
      return response.data.map((item: any) => ({
        id: item.ilha,
        nome: item.ilha,
        ilha: item.ilha
      }));
    } catch {
      return [];
    }
  },
  
  getCountiesByIsland: async (ilha: string): Promise<GeographicItem[]> => {
    try {
      const response = await api.get(`/geografia/concelhos/${ilha}`);
      
      return response.data.map((item: any) => ({
        id: item.concelho,
        nome: item.concelho,
        concelho: item.concelho
      }));
    } catch {
      return [];
    }
  },
  
  getParishesByCounty: async (concelho: string): Promise<GeographicItem[]> => {
    try {
      const response = await api.get(`/geografia/freguesias/${concelho}`);
      
      return response.data.map((item: any) => ({
        id: item.freguesia,
        nome: item.freguesia,
        freguesia: item.freguesia
      }));
    } catch {
      return [];
    }
  },
  
  getZonesByParish: async (freguesia: string): Promise<GeographicItem[]> => {
    try {
      const response = await api.get(`/geografia/zonas/${freguesia}`);
      return response.data.map((item: any) => ({
        id: item.id,
        zona: item.zona
      }));
    } catch {
      return [];
    }
  },

  getLugarByZones: async (zone: string): Promise<GeographicItem[]> => {
    try {
      const response = await api.get(`/geografia/lugar/${zone}`);
      console.log("Response from getLugarByZones:", response.data);
      return response.data.map((item: any) => ({
        id: item.id,
        lugar: item.lugar
      }));
    } catch {
      return [];
    }
  }
};

export const useGeography = () => {
  return {
    getIslands: geographyApi.getIslands,
    getCountiesByIsland: geographyApi.getCountiesByIsland,
    getParishesByCounty: geographyApi.getParishesByCounty,
    getZonesByParish: geographyApi.getZonesByParish,
    getLugarByZones: geographyApi.getLugarByZones
  };
};