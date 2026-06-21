import { makeAutoObservable, runInAction } from 'mobx';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/firebase';
import FirebaseService from '@/firebase';
import { User, UserRole, RegisteredUser, ROLE_PERMISSIONS, RolePermissions } from '@/types';
import { isValidEmail, isNotEmpty } from '@/utils/validators';
import { uiStore } from './UIStore';

const AUTH_STORAGE_KEY = 'student_voting_auth';
const SESSION_EXPIRY_KEY = 'student_voting_session_expiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

const AUTH_CREDENTIALS: Record<Exclude<UserRole, 'voter'>, string> = {
  moderator: 'moderator2026-voting',
  admin: 'admin2026-voting',
};

export type AuthModalTab = 'voter' | 'staff';
export type VoterAuthMode = 'login' | 'register';

export class AuthStore {
  private _staffRole: Exclude<UserRole, 'voter'> | null = null;
  private _firebaseUser: FirebaseUser | null = null;
  private _voterProfile: RegisteredUser | null = null;

  loginModalOpen = false;
  authModalTab: AuthModalTab = 'voter';
  voterAuthMode: VoterAuthMode = 'login';
  loginError: string | null = null;
  isLoading = false;
  authInitialized = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadStaffAuthState();
  }

  get user(): User {
    if (this._staffRole) {
      return { role: this._staffRole };
    }
    if (this._firebaseUser && this._voterProfile) {
      return {
        id: this._firebaseUser.uid,
        role: 'voter',
        email: this._voterProfile.email,
        name: this._voterProfile.name,
        approvalStatus: this._voterProfile.status,
      };
    }
    return { role: 'voter' };
  }

  get isAuthenticated(): boolean {
    return this._staffRole !== null || this._firebaseUser !== null;
  }

  get isStaffAuthenticated(): boolean {
    return this._staffRole !== null;
  }

  get isVoterAuthenticated(): boolean {
    return this._firebaseUser !== null;
  }

  get isApprovedVoter(): boolean {
    return this._voterProfile?.status === 'approved';
  }

  get isPendingApproval(): boolean {
    return this._voterProfile?.status === 'pending';
  }

  get isModerator(): boolean {
    return this._staffRole === 'moderator' || this._staffRole === 'admin';
  }

  get isAdmin(): boolean {
    return this._staffRole === 'admin';
  }

  get permissions(): RolePermissions {
    if (this._staffRole) {
      return ROLE_PERMISSIONS[this._staffRole];
    }
    return ROLE_PERMISSIONS.voter;
  }

  get currentRole(): UserRole {
    return this._staffRole ?? 'voter';
  }

  canViewElections = (): boolean => this.permissions.canViewElections;
  canViewCandidates = (): boolean => this.permissions.canViewCandidates;
  canViewResults = (): boolean => this.permissions.canViewResults;
  canVote = (): boolean => this.isApprovedVoter;
  canManageElections = (): boolean => this.permissions.canManageElections;
  canManageCandidates = (): boolean => this.permissions.canManageCandidates;
  canManageVoters = (): boolean => this.permissions.canManageVoters;
  canAccessAdmin = (): boolean => this.permissions.canAccessAdmin;

  hasRole = (r: UserRole): boolean => {
    const hierarchy: Record<UserRole, number> = { voter: 0, moderator: 1, admin: 2 };
    const effectiveRole = this._staffRole ?? 'voter';
    return hierarchy[effectiveRole] >= hierarchy[r];
  };

  getVoterId = (): string | null => {
    return this._firebaseUser?.uid ?? null;
  };

  initAuthListener = (): (() => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.loadVoterProfile(firebaseUser.uid);
        if (!this._voterProfile) {
          await signOut(auth);
          runInAction(() => {
            this._firebaseUser = null;
            this.authInitialized = true;
          });
          return;
        }
        runInAction(() => {
          this._firebaseUser = firebaseUser;
          this.authInitialized = true;
        });
        this.updatePendingBanner();
      } else {
        runInAction(() => {
          this._firebaseUser = null;
          this._voterProfile = null;
          this.authInitialized = true;
        });
        uiStore.clearPersistentToast();
      }
    });
  };

  private loadStaffAuthState = (): void => {
    try {
      const s = localStorage.getItem(AUTH_STORAGE_KEY);
      const e = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (s && e) {
        const a = JSON.parse(s);
        if (Date.now() < parseInt(e, 10) && a.role !== 'voter') {
          this._staffRole = a.role;
        } else {
          this.clearStaffAuthStorage();
        }
      }
    } catch {
      this.clearStaffAuthStorage();
    }
  };

  private saveStaffAuthState = (): void => {
    try {
      if (this._staffRole) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role: this._staffRole }));
        localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
      } else {
        this.clearStaffAuthStorage();
      }
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  private clearStaffAuthStorage = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  };

  private loadVoterProfile = async (uid: string): Promise<void> => {
    try {
      const profile = await FirebaseService.getSnapshot<RegisteredUser>(`users/${uid}`);
      runInAction(() => {
        this._voterProfile = profile;
      });
    } catch {
      runInAction(() => {
        this._voterProfile = null;
      });
    }
  };

  private updatePendingBanner = (): void => {
    if (this.isPendingApproval) {
      uiStore.showPersistentWarning('Ожидает подтверждения администратора');
    } else {
      uiStore.clearPersistentToast();
    }
  };

  openLoginModal = (tab: AuthModalTab = 'voter', mode: VoterAuthMode = 'login'): void => {
    this.authModalTab = tab;
    this.voterAuthMode = mode;
    this.loginModalOpen = true;
    this.loginError = null;
  };

  closeLoginModal = (): void => {
    this.loginModalOpen = false;
    this.loginError = null;
    this.isLoading = false;
  };

  setAuthModalTab = (tab: AuthModalTab): void => {
    this.authModalTab = tab;
    this.loginError = null;
  };

  setVoterAuthMode = (mode: VoterAuthMode): void => {
    this.voterAuthMode = mode;
    this.loginError = null;
  };

  registerVoter = async (email: string, password: string, name: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    if (!isNotEmpty(name)) {
      this.loginError = 'Введите ФИО';
      this.isLoading = false;
      return false;
    }
    if (!isValidEmail(email)) {
      this.loginError = 'Некорректный email';
      this.isLoading = false;
      return false;
    }
    if (password.length < 6) {
      this.loginError = 'Пароль должен содержать минимум 6 символов';
      this.isLoading = false;
      return false;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const now = new Date().toISOString();
      const profile: RegisteredUser = {
        id: credential.user.uid,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        status: 'pending',
        role: 'voter',
        createdAt: now,
      };

      await FirebaseService.setData(`users/${credential.user.uid}`, profile);

      runInAction(() => {
        this._firebaseUser = credential.user;
        this._voterProfile = profile;
      });

      this.updatePendingBanner();
      this.closeLoginModal();
      uiStore.showInfo('Регистрация успешна. Ожидайте подтверждения администратора.');
      return true;
    } catch (error: unknown) {
      this.loginError = this.getFirebaseAuthErrorMessage(error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  loginVoter = async (email: string, password: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    if (!isValidEmail(email)) {
      this.loginError = 'Некорректный email';
      this.isLoading = false;
      return false;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await this.loadVoterProfile(credential.user.uid);

      if (!this._voterProfile) {
        await signOut(auth);
        this.loginError = 'Профиль пользователя не найден';
        return false;
      }

      runInAction(() => {
        this._firebaseUser = credential.user;
      });

      this.updatePendingBanner();
      this.closeLoginModal();
      return true;
    } catch (error: unknown) {
      this.loginError = this.getFirebaseAuthErrorMessage(error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  loginStaff = async (role: Exclude<UserRole, 'voter'>, password: string): Promise<boolean> => {
    this.isLoading = true;
    this.loginError = null;

    try {
      await new Promise(r => setTimeout(r, 300));
      if (AUTH_CREDENTIALS[role] === password) {
        if (this._firebaseUser) {
          await signOut(auth);
        }
        runInAction(() => {
          this._staffRole = role;
          this._firebaseUser = null;
          this._voterProfile = null;
        });
        this.saveStaffAuthState();
        uiStore.clearPersistentToast();
        this.closeLoginModal();
        return true;
      }
      this.loginError = 'Неверный пароль';
      return false;
    } catch (error) {
      this.loginError = 'Ошибка авторизации';
      console.error('Login error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  logout = async (): Promise<void> => {
    if (this._firebaseUser) {
      await signOut(auth);
    }
    runInAction(() => {
      this._staffRole = null;
      this._firebaseUser = null;
      this._voterProfile = null;
    });
    this.clearStaffAuthStorage();
    this.loginError = null;
    uiStore.clearPersistentToast();
  };

  refreshVoterProfile = async (): Promise<void> => {
    if (!this._firebaseUser) return;
    await this.loadVoterProfile(this._firebaseUser.uid);
    this.updatePendingBanner();
  };

  clearError = (): void => { this.loginError = null; };

  private getFirebaseAuthErrorMessage = (error: unknown): string => {
    const code = (error as { code?: string })?.code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email уже зарегистрирован';
      case 'auth/invalid-email':
        return 'Некорректный email';
      case 'auth/weak-password':
        return 'Слишком слабый пароль';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Неверный email или пароль';
      case 'auth/too-many-requests':
        return 'Слишком много попыток. Попробуйте позже';
      default:
        return 'Ошибка авторизации';
    }
  };
}

export const authStore = new AuthStore();
