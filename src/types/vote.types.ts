// Vote Types

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  votedAt: string;
  isActive: boolean;
}

export interface VoteFormData {
  electionId: string;
  candidateId: string;
}

export interface VoterRecord {
  hasVoted: boolean;
  votedAt: string;
}
