const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000/api'
  : '/kopdig/api';

interface FetchOptions extends RequestInit {
  body?: any;
}

async function request(endpoint: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/' : '/kopdig/';
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Terjadi kesalahan pada server');
  }

  return data;
}

export const api = {
  // Auth
  login: (body: any) => request('/auth/login', { method: 'POST', body }),
  register: (body: any) => request('/auth/register', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me', { method: 'GET' }),

  // Anggota Dashboard
  getAnggotaDashboardStats: () => request('/anggota/dashboard-stats', { method: 'GET' }),
  getAnggotaTransactions: () => request('/anggota/transactions', { method: 'GET' }),

  // Simpanan
  getSavings: () => request('/anggota/simpanan', { method: 'GET' }),
  submitSaving: (body: any) => request('/anggota/simpanan', { method: 'POST', body }),

  // Tarik Simpanan
  getWithdrawals: () => request('/anggota/tarik-simpanan', { method: 'GET' }),
  submitWithdrawal: (body: any) => request('/anggota/tarik-simpanan', { method: 'POST', body }),

  // Pinjaman & Angsuran
  getLoans: () => request('/anggota/pinjaman', { method: 'GET' }),
  submitLoan: (body: any) => request('/anggota/pengajuan-pinjaman', { method: 'POST', body }),
  payInstallment: (body: any) => request('/anggota/bayar-angsuran', { method: 'POST', body }),

  // Admin Dashboard
  getAdminDashboardStats: () => request('/admin/dashboard-stats', { method: 'GET' }),

  // Admin Members CRUD
  getAdminMembers: () => request('/admin/anggota', { method: 'GET' }),
  createAdminMember: (body: any) => request('/admin/anggota', { method: 'POST', body }),
  updateAdminMember: (id: number, body: any) => request(`/admin/anggota/${id}`, { method: 'PUT', body }),

  // Admin Savings Approval
  getAdminSavings: () => request('/admin/simpanan', { method: 'GET' }),
  verifySaving: (id: number, status: 'approved' | 'rejected') => request(`/admin/simpanan/${id}/action`, { method: 'POST', body: { status } }),

  // Admin Loans Approval
  getAdminLoans: () => request('/admin/pinjaman', { method: 'GET' }),
  verifyLoan: (id: number, status: 'approved' | 'rejected') => request(`/admin/pinjaman/${id}/action`, { method: 'POST', body: { status } }),

  // Admin Installments Approval
  getAdminInstallments: () => request('/admin/angsuran', { method: 'GET' }),
  verifyInstallment: (id: number, status: 'approved' | 'rejected') => request(`/admin/angsuran/${id}/action`, { method: 'POST', body: { status } }),

  // Admin Reports
  getAdminReports: () => request('/admin/laporan', { method: 'GET' }),
};
