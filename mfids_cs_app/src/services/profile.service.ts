import { api } from "@/lib/api";
import { ProfileData } from "@/types/type";

export const profileApi = {
  getProfile: async (): Promise<ProfileData> => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<ProfileData>): Promise<ProfileData> => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (data: { old_password: string; new_password: string, confirm_password: string, email: string }): Promise<void> => {
    try {
      await api.post('/auth/change-password', data);
    } catch (error) {
      throw error;
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await api.post('/auth/password/reset', { email });
    } catch (error) {
      throw error;
    }
  },

  confirmPasswordReset: async (
    uid: string, 
    token: string, 
    data: { new_password: string; confirm_password: string, }
  ): Promise<void> => {
    try {
      await api.post(`/auth/password-reset-confirm/${uid}/${token}`, data);
    } catch (error) {
      throw error;
    }
  }
};

export const useProfile = () => {
  return {
    getProfile: profileApi.getProfile,
    updateProfile: profileApi.updateProfile,
    changePassword: profileApi.changePassword,
    requestPasswordReset: profileApi.requestPasswordReset,
    confirmPasswordReset: profileApi.confirmPasswordReset
  };
};