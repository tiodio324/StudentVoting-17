import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore } from '@/store';
import { Card, Button, Badge, Input, Modal } from '@/components/UI';
import type { Election } from '@/types';
import styles from './ElectionsPage.module.scss';

export const ElectionsPage = observer(() => {
  const { 
    filteredElections, 
    getCandidatesForElection,
    loadAllData, 
    electionsLoading,
    setFilter,
    filters
  } = dataStore;
  const { navigate } = navigationStore;
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
      active: 'success',
      upcoming: 'info',
      completed: 'warning',
      draft: 'error',
      cancelled: 'error',
    };
    const labels: Record<string, string> = {
      active: 'Активно',
      upcoming: 'Предстоящие',
      completed: 'Завершено',
      draft: 'Черновик',
      cancelled: 'Отменено',
    };
    return <Badge variant={variants[status] || 'info'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Выборы</h1>
        <p className={styles.subtitle}>Текущие и предстоящие голосования</p>
      </div>

      <Card className={styles.toolbar}>
        <Input
          placeholder="Поиск выборов..."
          value={filters.search || ''}
          onChange={(e) => setFilter('search', e.target.value || undefined)}
          className={styles.searchInput}
        />
        <div className={styles.statusFilters}>
          <Button 
            variant={!filters.status ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('status', undefined)}
          >
            Все
          </Button>
          <Button 
            variant={filters.status === 'active' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('status', 'active')}
          >
            Активные
          </Button>
          <Button 
            variant={filters.status === 'upcoming' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('status', 'upcoming')}
          >
            Предстоящие
          </Button>
          <Button 
            variant={filters.status === 'completed' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('status', 'completed')}
          >
            Завершённые
          </Button>
        </div>
      </Card>

      {electionsLoading ? (
        <Card className={styles.loading}>Загрузка...</Card>
      ) : filteredElections.length === 0 ? (
        <Card className={styles.empty}>
          <p>Выборы не найдены</p>
        </Card>
      ) : (
        <div className={styles.electionsList}>
          {filteredElections.map(election => (
            <Card 
              key={election.id} 
              className={styles.electionCard}
              hoverable
              onClick={() => setSelectedElection(election)}
            >
              <div className={styles.electionHeader}>
                <h3 className={styles.electionTitle}>{election.title}</h3>
                {getStatusBadge(election.status)}
              </div>
              <p className={styles.electionDescription}>{election.description}</p>
              <div className={styles.electionMeta}>
                <span className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDate(election.startDate)} — {formatDate(election.endDate)}
                </span>
                <span className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {getCandidatesForElection(election.id).length} кандидатов
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedElection}
        onClose={() => setSelectedElection(null)}
        title={selectedElection?.title || ''}
      >
        {selectedElection && (
          <div className={styles.electionDetail}>
            <div className={styles.detailStatus}>
              {getStatusBadge(selectedElection.status)}
            </div>
            <p className={styles.detailDescription}>{selectedElection.description}</p>
            <div className={styles.detailDates}>
              <strong>Период голосования:</strong><br />
              {formatDate(selectedElection.startDate)} — {formatDate(selectedElection.endDate)}
            </div>
            <div className={styles.detailInfo}>
              <p>Анонимное голосование: {selectedElection.isAnonymous ? 'Да' : 'Нет'}</p>
              <p>Макс. голосов на избирателя: {selectedElection.maxVotesPerVoter}</p>
            </div>
            <div className={styles.detailActions}>
              {selectedElection.status === 'active' && (
                <Button 
                  variant="primary"
                  onClick={() => {
                    setSelectedElection(null);
                    setFilter('electionId', selectedElection.id);
                    navigate('candidates');
                  }}
                >
                  Перейти к голосованию
                </Button>
              )}
              <Button 
                variant="ghost"
                onClick={() => setSelectedElection(null)}
              >
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});
