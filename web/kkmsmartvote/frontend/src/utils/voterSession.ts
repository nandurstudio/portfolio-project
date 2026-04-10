const TOKEN_KEY = "voting_token";
const EMAIL_KEY = "voter_email";
const MEMBER_KEY = "voter_member";
const SITE_KEY = "voter_site";
const CANDIDATE_KEY = "voter_selected_candidate";
const VOTE_KEY = "voter_last_vote";
const OTP_DRAFT_KEY = "voter_otp_draft";

export const voterSession = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  getEmail: () => localStorage.getItem(EMAIL_KEY),

  setToken: (token: string, email?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  },

  getMember: <T>() => {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setMember: (member: unknown) => {
    if (member === null || member === undefined) {
      localStorage.removeItem(MEMBER_KEY);
      return;
    }
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  },

  clearMember: () => {
    localStorage.removeItem(MEMBER_KEY);
  },

  getSite: <T>() => {
    const raw = localStorage.getItem(SITE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setSite: (site: unknown) => {
    if (site === null || site === undefined) {
      localStorage.removeItem(SITE_KEY);
      return;
    }
    localStorage.setItem(SITE_KEY, JSON.stringify(site));
  },

  clearSite: () => {
    localStorage.removeItem(SITE_KEY);
  },

  getSelectedCandidate: <T>() => {
    const raw = localStorage.getItem(CANDIDATE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setSelectedCandidate: (candidate: unknown) => {
    localStorage.setItem(CANDIDATE_KEY, JSON.stringify(candidate));
  },

  clearSelectedCandidate: () => {
    localStorage.removeItem(CANDIDATE_KEY);
  },

  setLastVote: (vote: unknown) => {
    localStorage.setItem(VOTE_KEY, JSON.stringify(vote));
  },

  getLastVote: <T>() => {
    const raw = localStorage.getItem(VOTE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clearLastVote: () => {
    localStorage.removeItem(VOTE_KEY);
  },

  getOtpDraft: <T>() => {
    const raw = localStorage.getItem(OTP_DRAFT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setOtpDraft: (draft: unknown) => {
    if (draft === null || draft === undefined) {
      localStorage.removeItem(OTP_DRAFT_KEY);
      return;
    }
    localStorage.setItem(OTP_DRAFT_KEY, JSON.stringify(draft));
  },

  clearOtpDraft: () => {
    localStorage.removeItem(OTP_DRAFT_KEY);
  },

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(MEMBER_KEY);
    localStorage.removeItem(SITE_KEY);
    localStorage.removeItem(CANDIDATE_KEY);
    localStorage.removeItem(VOTE_KEY);
    localStorage.removeItem(OTP_DRAFT_KEY);
  },
};
