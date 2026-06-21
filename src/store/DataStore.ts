import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { 
  Election, ElectionFormData, ElectionStatus,
  Candidate, CandidateFormData,
  Vote, VoteFormData, VoterRecord,
  ElectionResult, CandidateResult,
  FilterParams,
  RegisteredUser,
  VoterApprovalStatus,
} from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';

export class DataStore {
  elections: Election[] = [];
  candidates: Candidate[] = [];
  votes: Vote[] = [];
  registeredUsers: RegisteredUser[] = [];
  /** voterRecords[electionId][voterId] */
  voterRecords: Record<string, Record<string, VoterRecord>> = {};

  electionsLoading = false;
  candidatesLoading = false;
  votesLoading = false;
  usersLoading = false;

  error: string | null = null;
  filters: FilterParams = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // === COMPUTED PROPERTIES ===

  get activeElections(): Election[] {
    return this.elections.filter(e => e.isActive).sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  get upcomingElections(): Election[] {
    return this.activeElections.filter(e => e.status === 'upcoming');
  }

  get ongoingElections(): Election[] {
    return this.activeElections.filter(e => e.status === 'active');
  }

  get completedElections(): Election[] {
    return this.activeElections.filter(e => e.status === 'completed');
  }

  get activeCandidates(): Candidate[] {
    return this.candidates.filter(c => c.isActive);
  }

  get pendingUsers(): RegisteredUser[] {
    return this.registeredUsers.filter(u => u.status === 'pending');
  }

  get filteredElections(): Election[] {
    let result = this.activeElections;
    
    if (this.filters.status) {
      result = result.filter(e => e.status === this.filters.status);
    }
    
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(search) ||
        e.description.toLowerCase().includes(search)
      );
    }
    
    return result;
  }

  get filteredCandidates(): Candidate[] {
    let result = this.activeCandidates;
    
    if (this.filters.electionId) {
      result = result.filter(c => c.electionId === this.filters.electionId);
    }
    
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      result = result.filter(c => 
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.position.toLowerCase().includes(search)
      );
    }
    
    return result.sort((a, b) => b.votesCount - a.votesCount);
  }

  get totalVotes(): number {
    return this.votes.filter(v => v.isActive).length;
  }

  // === GET BY ID ===

  getElectionById = (id: string): Election | undefined => {
    return this.elections.find(e => e.id === id);
  };

  getCandidateById = (id: string): Candidate | undefined => {
    return this.candidates.find(c => c.id === id);
  };

  getCandidatesForElection = (electionId: string): Candidate[] => {
    return this.activeCandidates
      .filter(c => c.electionId === electionId)
      .sort((a, b) => b.votesCount - a.votesCount);
  };

  getVoterRecord = (electionId: string, voterId: string): VoterRecord | undefined => {
    return this.voterRecords[electionId]?.[voterId];
  };

  hasUserVoted = (electionId: string, voterId: string): boolean => {
    const record = this.getVoterRecord(electionId, voterId);
    return record?.hasVoted === true;
  };

  getElectionResults = (electionId: string): ElectionResult | null => {
    const election = this.getElectionById(electionId);
    if (!election) return null;

    const candidates = this.getCandidatesForElection(electionId);
    const electionVotes = this.votes.filter(v => v.electionId === electionId && v.isActive);
    const totalVotes = electionVotes.length;
    const electionRecords = this.voterRecords[electionId] ?? {};
    const totalVoters = Object.keys(electionRecords).length || this.registeredUsers.filter(u => u.status === 'approved').length || 1;

    const candidateResults: CandidateResult[] = candidates.map((c, index) => ({
      candidateId: c.id,
      candidateName: `${c.lastName} ${c.firstName}`,
      position: c.position,
      votesCount: c.votesCount,
      percentage: totalVotes > 0 ? Math.round((c.votesCount / totalVotes) * 100) : 0,
      rank: index + 1,
    }));

    return {
      electionId,
      electionTitle: election.title,
      totalVoters,
      totalVotes,
      turnoutPercentage: Math.round((totalVotes / totalVoters) * 100),
      candidateResults,
      calculatedAt: new Date().toISOString(),
    };
  };

  // === LOAD DATA ===

  loadAllData = async (): Promise<void> => {
    await Promise.all([
      this.loadElections(),
      this.loadCandidates(),
      this.loadVotes(),
      this.loadVoterRecords(),
      this.loadRegisteredUsers(),
    ]);
  };

  loadElections = async (): Promise<void> => {
    this.electionsLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, Election>>('elections');
      runInAction(() => {
        this.elections = data ? Object.values(data) : [];
        this.electionsLoading = false;
      });
    } catch {
      runInAction(() => {
        this.error = 'Ошибка загрузки выборов';
        this.electionsLoading = false;
      });
    }
  };

  loadCandidates = async (): Promise<void> => {
    this.candidatesLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, Candidate>>('candidates');
      runInAction(() => {
        this.candidates = data ? Object.values(data) : [];
        this.candidatesLoading = false;
      });
    } catch {
      runInAction(() => {
        this.error = 'Ошибка загрузки кандидатов';
        this.candidatesLoading = false;
      });
    }
  };

  loadVotes = async (): Promise<void> => {
    this.votesLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, Vote>>('votes');
      runInAction(() => {
        this.votes = data ? Object.values(data) : [];
        this.votesLoading = false;
      });
    } catch {
      runInAction(() => {
        this.error = 'Ошибка загрузки голосов';
        this.votesLoading = false;
      });
    }
  };

  loadVoterRecords = async (): Promise<void> => {
    try {
      const data = await FirebaseService.getData<Record<string, Record<string, VoterRecord>>>('voterRecords');
      runInAction(() => {
        this.voterRecords = data ?? {};
      });
    } catch {
      console.error('Error loading voter records');
    }
  };

  loadRegisteredUsers = async (): Promise<void> => {
    this.usersLoading = true;
    try {
      const data = await FirebaseService.getData<Record<string, RegisteredUser>>('users');
      runInAction(() => {
        this.registeredUsers = data ? Object.values(data) : [];
        this.usersLoading = false;
      });
    } catch {
      runInAction(() => {
        this.usersLoading = false;
      });
    }
  };

  // === CRUD ELECTIONS ===

  createElection = async (data: ElectionFormData): Promise<Election | null> => {
    if (!authStore.canManageElections()) return null;

    const now = new Date().toISOString();
    const status: ElectionStatus = new Date(data.startDate) > new Date() ? 'upcoming' : 'draft';

    const election: Election = {
      id: uuidv4(),
      ...data,
      status,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`elections/${election.id}`, election);
      runInAction(() => {
        this.elections.push(election);
      });
      return election;
    } catch {
      return null;
    }
  };

  updateElection = async (id: string, data: Partial<ElectionFormData>): Promise<boolean> => {
    if (!authStore.canManageElections()) return false;

    const index = this.elections.findIndex(e => e.id === id);
    if (index === -1) return false;

    const updated: Election = {
      ...this.elections[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`elections/${id}`, updated);
      runInAction(() => {
        this.elections[index] = updated;
      });
      return true;
    } catch {
      return false;
    }
  };

  updateElectionStatus = async (id: string, status: ElectionStatus): Promise<boolean> => {
    if (!authStore.canManageElections()) return false;

    const index = this.elections.findIndex(e => e.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`elections/${id}`, { status, updatedAt: new Date().toISOString() });
      runInAction(() => {
        this.elections = this.elections.map(e =>
          e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e
        );
      });
      return true;
    } catch {
      return false;
    }
  };

  deleteElection = async (id: string): Promise<boolean> => {
    if (!authStore.canManageElections()) return false;

    const index = this.elections.findIndex(e => e.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`elections/${id}`, { isActive: false });
      runInAction(() => {
        this.elections[index].isActive = false;
      });
      return true;
    } catch {
      return false;
    }
  };

  // === CRUD CANDIDATES ===

  createCandidate = async (data: CandidateFormData): Promise<Candidate | null> => {
    if (!authStore.canManageCandidates()) return null;

    const now = new Date().toISOString();
    const candidate: Candidate = {
      id: uuidv4(),
      ...data,
      middleName: data.middleName || '',
      photoUrl: data.photoUrl || '',
      votesCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await FirebaseService.setData(`candidates/${candidate.id}`, candidate);
      runInAction(() => {
        this.candidates.push(candidate);
      });
      return candidate;
    } catch {
      return null;
    }
  };

  updateCandidate = async (id: string, data: Partial<CandidateFormData>): Promise<boolean> => {
    if (!authStore.canManageCandidates()) return false;

    const index = this.candidates.findIndex(c => c.id === id);
    if (index === -1) return false;

    const updated: Candidate = {
      ...this.candidates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      await FirebaseService.setData(`candidates/${id}`, updated);
      runInAction(() => {
        this.candidates[index] = updated;
      });
      return true;
    } catch {
      return false;
    }
  };

  deleteCandidate = async (id: string): Promise<boolean> => {
    if (!authStore.canManageCandidates()) return false;

    const index = this.candidates.findIndex(c => c.id === id);
    if (index === -1) return false;

    try {
      await FirebaseService.updateData(`candidates/${id}`, { isActive: false });
      runInAction(() => {
        this.candidates[index].isActive = false;
      });
      return true;
    } catch {
      return false;
    }
  };

  // === USER MANAGEMENT ===

  updateUserStatus = async (userId: string, status: VoterApprovalStatus): Promise<boolean> => {
    if (!authStore.canManageVoters()) return false;

    const index = this.registeredUsers.findIndex(u => u.id === userId);
    if (index === -1) return false;

    const now = new Date().toISOString();

    try {
      await FirebaseService.updateData(`users/${userId}`, { status, updatedAt: now });
      runInAction(() => {
        this.registeredUsers = this.registeredUsers.map(u =>
          u.id === userId ? { ...u, status, updatedAt: now } : u
        );
      });

      if (authStore.user.id === userId) {
        await authStore.refreshVoterProfile();
      }

      return true;
    } catch {
      return false;
    }
  };

  // === VOTING ===

  castVote = async (data: VoteFormData, voterId: string): Promise<'success' | 'already_voted' | 'error'> => {
    if (!authStore.canVote()) return 'error';

    const election = this.getElectionById(data.electionId);
    if (!election || election.status !== 'active') return 'error';

    if (this.hasUserVoted(data.electionId, voterId)) return 'already_voted';

    const now = new Date().toISOString();
    const recordPath = `voterRecords/${data.electionId}/${voterId}`;

    try {
      const txResult = await FirebaseService.runTransaction<VoterRecord>(
        recordPath,
        (current) => {
          if (current?.hasVoted) return undefined;
          return { hasVoted: true, votedAt: now };
        },
      );

      if (!txResult.committed) {
        runInAction(() => {
          if (!this.voterRecords[data.electionId]) {
            this.voterRecords[data.electionId] = {};
          }
          this.voterRecords[data.electionId][voterId] = txResult.snapshot ?? { hasVoted: true, votedAt: now };
        });
        return 'already_voted';
      }

      const vote: Vote = {
        id: uuidv4(),
        electionId: data.electionId,
        candidateId: data.candidateId,
        votedAt: now,
        isActive: true,
      };

      try {
        await FirebaseService.setData(`votes/${vote.id}`, vote);
      } catch {
        await FirebaseService.removeData(recordPath);
        return 'error';
      }

      const candidateIndex = this.candidates.findIndex(c => c.id === data.candidateId);
      try {
        if (candidateIndex !== -1) {
          const newCount = this.candidates[candidateIndex].votesCount + 1;
          await FirebaseService.updateData(`candidates/${data.candidateId}`, { votesCount: newCount });
        }
      } catch {
        await FirebaseService.removeData(`votes/${vote.id}`);
        await FirebaseService.removeData(recordPath);
        return 'error';
      }

      runInAction(() => {
        if (!this.voterRecords[data.electionId]) {
          this.voterRecords[data.electionId] = {};
        }
        this.voterRecords[data.electionId][voterId] = { hasVoted: true, votedAt: now };
        this.votes.push(vote);
        if (candidateIndex !== -1) {
          this.candidates[candidateIndex].votesCount++;
        }
      });

      return 'success';
    } catch {
      return 'error';
    }
  };

  // === FILTERS ===

  setFilter = (key: keyof FilterParams, value: string | undefined): void => {
    this.filters = { ...this.filters, [key]: value };
  };

  clearFilters = (): void => {
    this.filters = {};
  };

  clearError = (): void => {
    this.error = null;
  };
}

export const dataStore = new DataStore();
