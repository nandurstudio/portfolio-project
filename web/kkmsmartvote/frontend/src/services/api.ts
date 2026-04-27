import axios from "axios";
import { notify } from "../utils/notify";
import { clearAdminSession } from "../components/admin/authStorage";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";
console.log("🔌 API baseURL:", baseURL);

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("admin_token") ??
    localStorage.getItem("token") ??
    localStorage.getItem("voting_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log("📤 Request:", config.method?.toUpperCase(), config.url);
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => {
    console.log("📥 Response:", res.status, res.config.url);
    return res;
  },
  (err) => {
    console.error(
      "❌ Response error:",
      err.response?.status,
      err.response?.data,
    );

    const errorMessage =
      err.response?.data?.message ||
      err.message ||
      "Terjadi kesalahan pada server.";

    const skipGlobalSwal = Boolean(
      err?.config?.headers?.["x-skip-global-swal"],
    );
    if (!skipGlobalSwal) {
      notify.error("Request Gagal", errorMessage);
    }

    if (err.response?.status === 401) {
      const url = String(err?.config?.url ?? "");
      const isAdminRequest = url.startsWith("/admin/");
      const skipAuthRedirect = Boolean(
        err?.config?.headers?.["x-skip-auth-redirect"],
      );

      if (isAdminRequest) {
        // Admin request unauthorized — clear admin session and redirect to admin login
        clearAdminSession();
        notify.error('Session Berakhir', 'Sesi admin Anda telah berakhir. Silakan login kembali.');
        window.location.href = '/admin';
      } else if (!skipAuthRedirect) {
        localStorage.removeItem("voting_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ── AUTH API ───────────────────────────────────────────────────────────────
export const authApi = {
  adminLogin: (username: string, password: string) =>
    api.post(
      "/auth/admin/login",
      { username, password },
      {
        headers: {
          "x-skip-auth-redirect": "1",
        },
      },
    ),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ── VOTING API (OTP-based, 2-layer verification) ────────────────────────────
export const votingApi = {
  // Layer 1: Request OTP by email
  requestOtp: (payload: {
    member_nik: string;
    email: string;
    site_id?: number | null;
  }) => api.post("/voting/request-otp", payload),

  // Layer 1.5: Verify OTP code & get JWT token
  verifyOtp: (otpId: number, otpCode: string) =>
    api.post(
      "/voting/verify-otp",
      { otp_id: otpId, otp_code: otpCode },
      {
        headers: {
          "x-skip-global-swal": "1",
          "x-skip-auth-redirect": "1",
        },
      },
    ),

  // Layer 2: Member lookup by NIK
  memberLookup: (nik: string) =>
    api.get(`/voting/member-lookup/${nik}`, {
      headers: { "x-skip-global-swal": "1" },
    }),

  // Public site list for voting flow
  sites: () => api.get("/voting/sites"),

  // Get all candidates with details
  candidatesWithDetails: () => api.get("/voting/candidates-with-details"),

  // Get election status & countdown
  electionStatus: () => api.get("/voting/election-status"),

  // Submit vote (triple-check protection)
  submitVote: (memberNik: string, candidateId: number, siteId: number) =>
    api.post("/voting/submit", {
      member_nik: memberNik,
      candidate_id: candidateId,
      site_id: siteId,
    }),

  // Save/update voucher Gopay information
  updateVoucherGopay: (payload: {
    code: string;
    member_nik: string;
    gopay_number: string;
    gopay_is_owner_self: boolean;
    gopay_owner_name?: string;
  }) => api.post("/voting/voucher/gopay", payload),
};

// ── STATISTICS API ────────────────────────────────────────────────────────
export const statsApi = {
  // Overall voting progress
  votingProgress: () => api.get("/stats/voting-progress"),

  // Per-candidate votes & threshold status
  candidateVotes: () => api.get("/stats/candidate-votes"),

  // Breakdown by department & site
  departmentBreakdown: () => api.get("/stats/department-breakdown"),
};

// ── ELECTION API (Admin only) ──────────────────────────────────────────────
export const electionApi = {
  // Get current election settings
  current: () => api.get("/election/info"),

  // Get public participation stats for landing
  stats: () => api.get("/election/stats"),

  // Start election (DRAFT → OPEN)
  start: () => api.post("/election/start"),

  // Close election (OPEN → CLOSED)
  close: () => api.post("/election/close"),

  // Update election settings (DRAFT only)
  update: (data: object) => api.put("/admin/election/settings", data),
};

// ── CANDIDATES API ────────────────────────────────────────────────────────
export const candidatesApi = {
  // List all active candidates
  index: () => api.get("/candidates"),

  // List candidates for admin setup
  adminIndex: () => api.get("/admin/candidates"),

  // Create candidate (Admin only)
  store: (data: object) => api.post("/admin/candidates", data),

  // Update candidate (Admin only)
  update: (id: number, data: object) =>
    api.put(`/admin/candidates/${id}`, data),

  // Delete candidate (Admin only, soft-delete)
  destroy: (id: number) => api.delete(`/admin/candidates/${id}`),

  // Upload candidate photo (Admin only)
  uploadPhoto: (
    id: number,
    file: File,
    onUploadProgress?: (percent: number) => void,
  ) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post(`/admin/candidates/${id}/upload-photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45000,
      onUploadProgress: (event) => {
        if (!event.total || !onUploadProgress) return;
        const percent = Math.min(
          100,
          Math.round((event.loaded * 100) / event.total),
        );
        onUploadProgress(percent);
      },
    });
  },
};

// ── MEMBERS API (Admin) ───────────────────────────────────────────────────
export const membersApi = {
  // Lookup member identity by NIK for candidate setup autofill
  byNik: (nik: string) =>
    api.get(`/admin/members/by-nik/${encodeURIComponent(nik)}`),
};

// ── VOUCHER API (Admin/Panitia only) ───────────────────────────────────────
export const voucherApi = {
  // Redeem voucher (Panitia/Admin only)
  redeem: (code: string) => api.post("/admin/voucher/redeem", { code }),

  // Verify voucher (check without redeeming)
  verify: (code: string) => api.get(`/admin/voucher/verify/${code}`),

  // Get voucher statistics (Admin only)
  stats: () => api.get("/admin/voucher/stats"),

  // List vouchers with filters & pagination (Admin only)
  list: (params?: {
    status?: string;
    department_id?: number;
    page?: number;
    limit?: number;
  }) => api.get("/admin/voucher/list", { params }),
};

// ── USER API ───────────────────────────────────────────────────────────────
export const userApi = {
  // Get current user profile (protected)
  getProfile: () => api.get("/user"),

  // Logout
  logout: () => api.post("/logout"),
};

// ── ADMIN MONITORING API ─────────────────────────────────────────────────
export const adminApi = {
  votes: (params?: {
    is_valid?: boolean;
    site_id?: number;
    site?: string;
    page?: number;
  }) => api.get("/admin/votes", { params }),

  auditLogs: (params?: {
    action?: string;
    actor?: string;
    q?: string;
    from?: string;
    to?: string;
    per_page?: number;
    page?: number;
  }) => api.get("/admin/audit-log", { params }),
};

// ── HEALTH CHECK ───────────────────────────────────────────────────────────
export const healthApi = {
  // Test endpoint
  test: () => api.get("/test"),

  // POST test endpoint
  testPost: (data: object) => api.post("/test", data),
};
