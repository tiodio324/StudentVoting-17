// User & Authentication Types

export type UserRole = 'voter' | 'moderator' | 'admin';

export type VoterApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  status: VoterApprovalStatus;
  role: 'voter';
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id?: string;
  role: UserRole;
  name?: string;
  email?: string;
  approvalStatus?: VoterApprovalStatus;
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
    canVote: false,
    canManageElections: false,
    canManageCandidates: false,
    canManageVoters: false,
    canAccessAdmin: false,
  },
  moderator: {
    canViewElections: true,
    canViewCandidates: true,
    canViewResults: true,
    canVote: false,
    canManageElections: true,
    canManageCandidates: true,
    canManageVoters: false,
    canAccessAdmin: false,
  },
  admin: {
    canViewElections: true,
    canViewCandidates: true,
    canViewResults: true,
    canVote: false,
    canManageElections: true,
    canManageCandidates: true,
    canManageVoters: true,
    canAccessAdmin: true,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[UserRole];
