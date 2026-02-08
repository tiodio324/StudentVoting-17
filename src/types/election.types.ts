// Election Types

export type ElectionStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ElectionStatus;
  maxVotesPerVoter: number;
  isAnonymous: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ElectionFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  maxVotesPerVoter: number;
  isAnonymous: boolean;
}
