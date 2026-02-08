// Result Types

export interface ElectionResult {
  electionId: string;
  electionTitle: string;
  totalVoters: number;
  totalVotes: number;
  turnoutPercentage: number;
  candidateResults: CandidateResult[];
  calculatedAt: string;
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  position: string;
  votesCount: number;
  percentage: number;
  rank: number;
}
