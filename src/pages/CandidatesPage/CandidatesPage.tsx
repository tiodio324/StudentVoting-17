import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, authStore, uiStore } from '@/store';
import { Card, Button, Badge, Input, Select, Modal } from '@/components/UI';
import type { Candidate } from '@/types';
import styles from './CandidatesPage.module.scss';

type VoteButtonState = {
  show: boolean;
  disabled: boolean;
  label: string;
  action: 'vote' | 'login' | 'none';
};

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
  const {
    canVote,
    getVoterId,
    isVoterAuthenticated,
    isStaffAuthenticated,
    isPendingApproval,
    openLoginModal,
  } = authStore;
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [votingCandidate, setVotingCandidate] = useState<Candidate | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const electionOptions = [
    { value: '', label: 'Все выборы' },
    ...activeElections.map(e => ({ value: e.id, label: e.title }))
  ];

  const getVoteButtonState = (candidate: Candidate): VoteButtonState => {
    const election = getElectionById(candidate.electionId);
    const voterId = getVoterId();

    if (election?.status !== 'active') {
      return { show: false, disabled: true, label: '', action: 'none' };
    }

    if (isStaffAuthenticated) {
      return { show: false, disabled: true, label: '', action: 'none' };
    }

    if (voterId && hasUserVoted(candidate.electionId, voterId)) {
      return { show: true, disabled: true, label: 'Вы уже проголосовали', action: 'none' };
    }

    if (!isVoterAuthenticated) {
      return { show: true, disabled: false, label: 'Войти для голосования', action: 'login' };
    }

    if (isPendingApproval) {
      return { show: true, disabled: true, label: 'Ожидает подтверждения администратора', action: 'none' };
    }

    if (!canVote()) {
      return { show: true, disabled: true, label: 'Доступ к голосованию не подтверждён', action: 'none' };
    }

    return { show: true, disabled: false, label: 'Голосовать', action: 'vote' };
  };

  const handleVoteClick = (candidate: Candidate) => {
    const buttonState = getVoteButtonState(candidate);

    if (buttonState.action === 'login') {
      openLoginModal('voter');
      return;
    }

    if (buttonState.disabled || buttonState.action !== 'vote') {
      return;
    }

    const election = getElectionById(candidate.electionId);
    const voterId = getVoterId();

    if (!election || election.status !== 'active') {
      uiStore.showError('Голосование не активно');
      return;
    }
    if (!voterId) {
      openLoginModal('voter');
      return;
    }
    if (hasUserVoted(candidate.electionId, voterId)) {
      uiStore.showError('Вы уже проголосовали в этих выборах');
      return;
    }

    setVotingCandidate(candidate);
    setVoteModalOpen(true);
  };

  const confirmVote = async () => {
    if (!votingCandidate || isSubmittingVote) return;

    const voterId = getVoterId();
    if (!voterId) {
      uiStore.showError('Необходимо войти в систему');
      openLoginModal('voter');
      return;
    }

    setIsSubmittingVote(true);

    const result = await castVote({
      electionId: votingCandidate.electionId,
      candidateId: votingCandidate.id,
    }, voterId);

    setIsSubmittingVote(false);

    if (result === 'success') {
      uiStore.showSuccess('Ваш голос учтён!');
      setVoteModalOpen(false);
      setVotingCandidate(null);
    } else if (result === 'already_voted') {
      uiStore.showError('Вы уже проголосовали в этих выборах');
      setVoteModalOpen(false);
      setVotingCandidate(null);
    } else {
      uiStore.showError('Ошибка при голосовании. Попробуйте позже');
    }
  };

  const getFullName = (c: Candidate) => 
    `${c.lastName} ${c.firstName}${c.middleName ? ' ' + c.middleName : ''}`;

  const confirmButtonState = votingCandidate
    ? getVoteButtonState(votingCandidate)
    : null;

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
            const voteButton = getVoteButtonState(candidate);
            
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
                  {voteButton.show && (
                    <Button 
                      variant={voteButton.action === 'login' ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={voteButton.disabled}
                      onClick={() => handleVoteClick(candidate)}
                    >
                      {voteButton.label}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

      <Modal
        isOpen={voteModalOpen}
        onClose={() => {
          if (!isSubmittingVote) {
            setVoteModalOpen(false);
            setVotingCandidate(null);
          }
        }}
        title="Подтверждение голоса"
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="ghost"
              onClick={() => setVoteModalOpen(false)}
              disabled={isSubmittingVote}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={confirmVote}
              loading={isSubmittingVote}
              disabled={confirmButtonState?.disabled || isSubmittingVote}
            >
              {confirmButtonState?.disabled ? confirmButtonState.label : 'Подтвердить'}
            </Button>
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
