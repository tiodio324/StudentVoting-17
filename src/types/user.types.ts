// User & Authentication Types

export type UserRole = 'voter' | 'moderator' | 'admin';

export interface User {
  id?: string;
  role: UserRole;
  name?: string;
  email?: string;
}

export interface AuthCredentials {
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User;
  loginModalOpen: boolean;
}

export const ROLE_PERMISSIONS = {
  voter: {
    canViewElections: true,
    canViewCandidates: true,
    canViewResults: true,
    canVote: true,
    canManageElections: false,
    canManageCandidates: false,
    canManageVoters: false,
    canAccessAdmin: false,
  },
  moderator: {
    canViewElections: true,
    canViewCandidates: true,
    canViewResults: true,
    canVote: true,
    canManageElections: true,
    canManageCandidates: true,
    canManageVoters: false,
    canAccessAdmin: false,
  },
  admin: {
    canViewElections: true,
    canViewCandidates: true,
    canViewResults: true,
    canVote: true,
    canManageElections: true,
    canManageCandidates: true,
    canManageVoters: true,
    canAccessAdmin: true,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
