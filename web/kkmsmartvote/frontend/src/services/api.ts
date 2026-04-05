import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";
console.log("🔌 API baseURL:", baseURL);

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post("/auth/admin/login", { username, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// ── Voter (public) ────────────────────────────────────────────────────────
export const voterApi = {
  verify: (name: string, nik: string, site: string) =>
    api.post("/voter/verify", { name, nik, site }),
  cast: (voter_token: string, candidate_id: number) =>
    api.post("/voter/cast", { voter_token, candidate_id }),
};

// ── Voting (OTP) ──────────────────────────────────────────────────────────
export const votingApi = {
  requestOtp: (email: string) => api.post("/voting/request-otp", { email }),
  verifyOtp: (email: string, otp_code: string) =>
    api.post("/voting/verify-otp", { email, otp_code }),
};

// ── Public ────────────────────────────────────────────────────────────────
export const publicApi = {
  candidates: () => api.get("/candidates"),
  electionInfo: () => api.get("/election/info"),
  electionStats: () => api.get("/election/stats"),
  publicResults: () => api.get("/results/public"),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  results: () => api.get("/admin/results"),
  finalize: () => api.post("/admin/election/finalize"),

  candidates: () => api.get("/admin/candidates"),
  addCandidate: (data: object) => api.post("/admin/candidates", data),
  updateCandidate: (id: number, data: object) =>
    api.put(`/admin/candidates/${id}`, data),
  deleteCandidate: (id: number) => api.delete(`/admin/candidates/${id}`),

  members: (params?: object) => api.get("/admin/members", { params }),
  addMember: (data: object) => api.post("/admin/members", data),

  votes: (params?: object) => api.get("/admin/votes", { params }),
  invalidateVote: (id: number, reason: string) =>
    api.post(`/admin/votes/${id}/invalidate`, { reason }),

  auditLog: () => api.get("/admin/audit-log"),

  users: () => api.get("/admin/users"),
  addUser: (data: object) => api.post("/admin/users", data),
  updateUser: (id: number, data: object) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  updateSettings: (data: object) => api.put("/admin/election/settings", data),
};
