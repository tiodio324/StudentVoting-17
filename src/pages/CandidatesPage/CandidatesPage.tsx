import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, uiStore } from '@/store';
import { Card, Button, Badge, Input, Select, Modal } from '@/components/UI';
import type { Candidate } from '@/types';
import styles from './CandidatesPage.module.scss';

export const CandidatesPage = observer(() => {
  const { 
    filteredCandidates, 
    activeElections,
    getElectionById,
    hasUserVoted,
    castVote,
    loadAllData, 
    candidatesLoading,
    setFilter,
    filters
  } = dataStore;
  const { user, canVote } = authStore;
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [votingCandidate, setVotingCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const electionOptions = [
    { value: '', label: 'Все выборы' },
    ...activeElections.map(e => ({ value: e.id, label: e.title }))
  ];

  const handleVoteClick = (candidate: Candidate) => {
    const election = getElectionById(candidate.electionId);
    if (!election || election.status !== 'active') {
      uiStore.showError('Голосование не активно');
      return;
    }
    if (hasUserVoted(candidate.electionId, user.id || 'anonymous')) {
      uiStore.showError('Вы уже проголосовали в этих выборах');
      return;
    }
    setVotingCandidate(candidate);
    setVoteModalOpen(true);
  };

  const confirmVote = async () => {
    if (!votingCandidate) return;
    
    const vote = await castVote({
      electionId: votingCandidate.electionId,
      candidateId: votingCandidate.id,
      voterId: user.id || `voter_${Date.now()}`,
    });

    if (vote) {
      uiStore.showSuccess('Ваш голос учтён!');
      setVoteModalOpen(false);
      setVotingCandidate(null);
    } else {
      uiStore.showError('Ошибка при голосовании');
    }
  };

  const getFullName = (c: Candidate) => 
    `${c.lastName} ${c.firstName}${c.middleName ? ' ' + c.middleName : ''}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Кандидаты</h1>
        <p className={styles.subtitle}>Информация о кандидатах и их программах</p>
      </div>

      <Card className={styles.toolbar}>
        <Input
          placeholder="Поиск кандидатов..."
          value={filters.search || ''}
          onChange={(e) => setFilter('search', e.target.value || undefined)}
          className={styles.searchInput}
        />
        <Select
          options={electionOptions}
          value={filters.electionId || ''}
          onChange={(e) => setFilter('electionId', e.target.value || undefined)}
          className={styles.electionSelect}
        />
      </Card>

      {candidatesLoading ? (
        <Card className={styles.loading}>Загрузка...</Card>
      ) : filteredCandidates.length === 0 ? (
        <Card className={styles.empty}>
          <p>Кандидаты не найдены</p>
        </Card>
      ) : (
        <div className={styles.candidatesList}>
          {filteredCandidates.map(candidate => {
            const election = getElectionById(candidate.electionId);
            const canVoteNow = election?.status === 'active' && 
              !hasUserVoted(candidate.electionId, user.id || 'anonymous');
            
            return (
              <Card 
                key={candidate.id} 
                className={styles.candidateCard}
              >
                <div className={styles.candidateAvatar}>
                  {candidate.photoUrl ? (
                    <img src={candidate.photoUrl} alt={getFullName(candidate)} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {candidate.lastName[0]}{candidate.firstName[0]}
                    </div>
                  )}
                </div>
                <div className={styles.candidateInfo}>
                  <h3 className={styles.candidateName}>{getFullName(candidate)}</h3>
                  <p className={styles.candidatePosition}>{candidate.position}</p>
                  <p className={styles.electionName}>{election?.title}</p>
                  <div className={styles.candidateStats}>
                    <Badge variant="info">{candidate.votesCount} голосов</Badge>
                  </div>
                </div>
                <div className={styles.candidateActions}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    Подробнее
                  </Button>
                  {canVote() && canVoteNow && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleVoteClick(candidate)}
                    >
                      Голосовать
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Candidate Detail Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title="Информация о кандидате"
      >
        {selectedCandidate && (
          <div className={styles.candidateDetail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>
                {selectedCandidate.photoUrl ? (
                  <img src={selectedCandidate.photoUrl} alt={getFullName(selectedCandidate)} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {selectedCandidate.lastName[0]}{selectedCandidate.firstName[0]}
                  </div>
                )}
              </div>
              <div>
                <h3>{getFullName(selectedCandidate)}</h3>
                <p className={styles.detailPosition}>{selectedCandidate.position}</p>
              </div>
            </div>
            <div className={styles.detailProgram}>
              <h4>Программа кандидата</h4>
              <p>{selectedCandidate.program}</p>
            </div>
            <div className={styles.detailStats}>
              <Badge variant="info">{selectedCandidate.votesCount} голосов</Badge>
            </div>
          </div>
        )}
      </Modal>

      {/* Vote Confirmation Modal */}
      <Modal
        isOpen={voteModalOpen}
        onClose={() => {
          setVoteModalOpen(false);
          setVotingCandidate(null);
        }}
        title="Подтверждение голоса"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setVoteModalOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={confirmVote}>Подтвердить</Button>
          </div>
        }
      >
        {votingCandidate && (
          <div className={styles.voteConfirm}>
            <p>Вы уверены, что хотите отдать голос за кандидата:</p>
            <strong>{getFullName(votingCandidate)}</strong>
            <p className={styles.voteWarning}>
              ⚠️ Это действие нельзя отменить. Голос можно отдать только один раз.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
});
