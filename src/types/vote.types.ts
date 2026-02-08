// Vote Types

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  voterId: string;
  votedAt: string;
  isActive: boolean;
}

export interface VoteFormData {
  electionId: string;
  candidateId: string;
  voterId: string;
}

export interface VoterRecord {
  id: string;
  electionId: string;
  voterId: string;
  hasVoted: boolean;
  votedAt?: string;
}
