export type AdminRole = "super_admin" | "admin" | "panitia" | "saksi_forensik";

export type AdminMenuItem = {
  key: string;
  label: string;
  path: string;
  description: string;
  roles: AdminRole[];
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin",
    description: "Ringkasan sistem dan akses cepat",
    roles: ["super_admin", "admin", "panitia", "saksi_forensik"],
  },
  {
    key: "setup-landing",
    label: "Setup Landing",
    path: "/admin/setup-landing",
    description: "Konten landing, agenda, countdown, SEO",
    roles: ["super_admin", "admin", "panitia"],
  },
  {
    key: "master-users",
    label: "Master User",
    path: "/admin/master-users",
    description: "Kelola akun admin, panitia, dan hak akses",
    roles: ["super_admin"],
  },
  {
    key: "master-members",
    label: "Master Member",
    path: "/admin/master-members",
    description: "Kelola data member lengkap + status voting/OTP/redeem",
    roles: ["super_admin", "admin"],
  },
  {
    key: "master-departments",
    label: "Master Dept",
    path: "/admin/master-departments",
    description: "Kelola data departemen untuk pemetaan anggota",
    roles: ["super_admin", "admin"],
  },
  {
    key: "master-candidates",
    label: "Master Kandidat",
    path: "/admin/master-candidates",
    description: "Kelola kandidat untuk landing dan halaman voting",
    roles: ["super_admin", "admin"],
  },
  {
    key: "votes",
    label: "Monitoring Vote",
    path: "/admin/votes",
    description: "Pantau progress voting secara realtime",
    roles: ["super_admin", "admin", "panitia", "saksi_forensik"],
  },
];

export const hasRoleAccess = (
  role: AdminRole | null,
  allowedRoles: AdminRole[],
) => {
  if (!role) return false;
  return allowedRoles.includes(role);
};
