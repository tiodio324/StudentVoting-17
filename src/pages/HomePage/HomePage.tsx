import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, navigationStore } from '@/store';
import { Card, Button, Badge } from '@/components/UI';
import styles from './HomePage.module.scss';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
}) => (
  <Card className={`${styles.statCard} ${styles[color]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statTitle}>{title}</span>
    </div>
  </Card>
);

export const HomePage = observer(() => {
  const { 
    ongoingElections, 
    completedElections, 
    activeCandidates, 
    totalVotes,
    loadAllData, 
    electionsLoading 
  } = dataStore;
  const { isModerator } = authStore;
  const { navigate } = navigationStore;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Система голосования студенческого самоуправления
          </h1>
          <p className={styles.welcomeText}>
            Платформа для проведения честных и прозрачных выборов в органы студенческого самоуправления.
            {!isModerator && ' Войдите в систему для управления выборами.'}
          </p>
          {!authStore.isAuthenticated && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => authStore.openLoginModal()}
            >
              Войти в систему
            </Button>
          )}
        </div>
        <div className={styles.welcomeDecor}>
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="2" opacity="0.4" />
            <path d="M100 30 L100 170 M30 100 L170 100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          </svg>
        </div>
      </section>

      <section className={styles.stats}>
        <StatCard 
          title="Активных выборов"
          value={electionsLoading ? '...' : ongoingElections.length}
          color="primary"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          }
        />
        <StatCard 
          title="Кандидатов"
          value={activeCandidates.length}
          color="info"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          }
        />
        <StatCard 
          title="Завершённых выборов"
          value={completedElections.length}
          color="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard 
          title="Всего голосов"
          value={totalVotes}
          color="warning"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          }
        />
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Быстрые действия</h2>
        <div className={styles.actionCards}>
          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('elections')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3>Выборы</h3>
            <p>Просмотр текущих и предстоящих выборов</p>
            {ongoingElections.length > 0 && (
              <Badge variant="success">
                {ongoingElections.length} активных
              </Badge>
            )}
          </Card>

          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('candidates')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3>Кандидаты</h3>
            <p>Информация о кандидатах и их программах</p>
          </Card>

          <Card 
            className={styles.actionCard} 
            hoverable 
            onClick={() => navigate('results')}
          >
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3>Результаты</h3>
            <p>Итоги голосований</p>
          </Card>

          {isModerator && (
            <Card 
              className={styles.actionCard} 
              hoverable 
              onClick={() => navigate('admin')}
            >
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </div>
              <h3>Управление</h3>
              <p>Создание и редактирование выборов</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
});
