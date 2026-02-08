// Navigation Types

export type PageId = 'home' | 'elections' | 'candidates' | 'results' | 'admin' | 'admin-elections' | 'admin-candidates';

export interface PageConfig {
  id: PageId;
  title: string;
  icon: string;
  requiresAuth: boolean;
  requiredRole?: 'moderator' | 'admin';
  showInNav: boolean;
  parentId?: PageId;
}

export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: { id: 'home', title: 'Главная', icon: 'home', requiresAuth: false, showInNav: true },
  elections: { id: 'elections', title: 'Выборы', icon: 'vote', requiresAuth: false, showInNav: true },
  candidates: { id: 'candidates', title: 'Кандидаты', icon: 'users', requiresAuth: false, showInNav: true },
  results: { id: 'results', title: 'Результаты', icon: 'bar-chart-2', requiresAuth: false, showInNav: true },
  admin: { id: 'admin', title: 'Управление', icon: 'settings', requiresAuth: true, requiredRole: 'moderator', showInNav: true },
  'admin-elections': { id: 'admin-elections', title: 'Выборы', icon: 'vote', requiresAuth: true, requiredRole: 'moderator', showInNav: false, parentId: 'admin' },
  'admin-candidates': { id: 'admin-candidates', title: 'Кандидаты', icon: 'users', requiresAuth: true, requiredRole: 'moderator', showInNav: false, parentId: 'admin' },
};
