export interface User {
  id: number;
  name: string;
  username: string;
  role: "super_admin" | "admin" | "panitia" | "saksi_forensik";
}

export interface Member {
  id: number;
  nik: string;
  name: string;
  site: string;
  is_eligible: boolean;
  has_voted: boolean;
  created_at: string;
}

export interface Candidate {
  id: number;
  name: string;
  position: string;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  valid_votes_count?: number;
}

export interface Vote {
  id: number;
  member_nik: string;
  member_name: string;
  site: string;
  candidate_id?: number; // only visible to admin
  is_valid: boolean;
  ip_address?: string;
  created_at: string;
  invalidated_at?: string;
  invalidation_reason?: string;
  invalidated_by?: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  ip_address: string | null;
  logged_at: string;
}

export interface ElectionSetting {
  id: number;
  election_name: string;
  period: string;
  start_date: string;
  end_date: string;
  end_time: string;
  is_active: boolean;
  is_finalized: boolean;
  voting_open?: boolean;
  winners_revealed?: boolean;
  winners_animation_duration_ms?: number;
}

export interface DashboardData {
  total_members: number;
  total_valid: number;
  total_invalid: number;
  participation_pct: number;
  site_vote_overview: {
    total_sites: number;
    sites_with_votes: number;
    sites_without_votes: number;
  };
  site_vote_chart: {
    site_id: number;
    site_code: string;
    site_name: string;
    total_votes: number;
    has_votes: boolean;
  }[];
  candidate_stats: (Candidate & { valid_votes: number })[];
  election: ElectionSetting;
}

export interface ResultItem {
  id: number;
  name: string;
  position: string;
  candidate_number?: number;
  photo_url?: string | null;
  vote_count: number;
  percentage: number;
  is_winner: boolean;
}

export interface ResultsData {
  total_valid: number;
  results: ResultItem[];
  status: "WINNER" | "TIE" | "NO_MAJORITY";
  winner: ResultItem | null;
}

export interface WinnersData extends ResultsData {
  election: ElectionSetting | null;
  winners_revealed: boolean;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}
