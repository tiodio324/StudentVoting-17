// Candidate Types

export interface Candidate {
  id: string;
  electionId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  position: string;
  program: string;
  photoUrl?: string;
  votesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateFormData {
  electionId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  position: string;
  program: string;
  photoUrl?: string;
}
