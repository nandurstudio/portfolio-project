import type { AdminRole } from "../../config/adminMenu";

export type AdminUser = {
  id: number;
  name: string;
  username: string;
  role: AdminRole;
};

const USER_KEY = "admin_user";

export const getStoredAdminUser = (): AdminUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.role || !parsed?.username) return null;
    return parsed as AdminUser;
  } catch {
    return null;
  }
};

export const setStoredAdminUser = (user: AdminUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAdminSession = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("token");
  localStorage.removeItem(USER_KEY);
};
