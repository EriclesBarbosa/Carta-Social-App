import { api } from "@/lib/api";
import { AuthResponse, LoginCredentials, User, UserData } from "@/types/type";
import Cookies from "js-cookie";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", credentials);

    if (response.data && response.data.token) {
      Cookies.set("mfids_token", response.data.token, { expires: 1 });

      localStorage.setItem("user", JSON.stringify(response.data.user));

      const permissionsJson = JSON.stringify(response.data.user.permission);
      Cookies.set("user_permissions", permissionsJson, {
        expires: 1,
        sameSite: "strict",
      });
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      Cookies.remove("mfids_token");
      Cookies.remove("user_permissions");
      localStorage.removeItem("user");
      localStorage.removeItem("user_type");
    }
  },

  getCurrentUser: (): UserData | null => {
    if (typeof window === "undefined") return null;

    const userString = localStorage.getItem("user");
    if (!userString) return null;

    return JSON.parse(userString);
  },

  getUserPermissions: (): any => {
    if (typeof window === "undefined") return null;

    const permissionsString = Cookies.get("user_permissions");
    if (!permissionsString) return null;

    return JSON.parse(permissionsString);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/profile");
    return response.data.user?.data || response.data;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;

    const token = Cookies.get("mfids_token");
    return !!token;
  },

  hasPermission: (module: string, action: string): boolean => {
    const permissions = authService.getUserPermissions();
    if (!permissions) return false;

    const modulePermissions = permissions[module];
    if (!modulePermissions || !modulePermissions.actions) return false;

    return modulePermissions.actions.includes(action);
  },

  hasAnyPermission: (
    permissionsToCheck: Array<{ module: string; action: string }>
  ): boolean => {
    return permissionsToCheck.some(({ module, action }) =>
      authService.hasPermission(module, action)
    );
  },

  hasAllPermissions: (
    permissionsToCheck: Array<{ module: string; action: string }>
  ): boolean => {
    return permissionsToCheck.every(({ module, action }) =>
      authService.hasPermission(module, action)
    );
  },
};
