import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore } from '@/store';
import { Card, Select, Badge } from '@/components/UI';
import type { ElectionResult } from '@/types';
import styles from './ResultsPage.module.scss';

export const ResultsPage = observer(() => {
  const { 
    completedElections, 
    ongoingElections,
    getElectionResults,
    loadAllData,
    electionsLoading
  } = dataStore;
  
  const allElectionsForResults = [...completedElections, ...ongoingElections];
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [results, setResults] = useState<ElectionResult | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (allElectionsForResults.length > 0 && !selectedElectionId) {
      setSelectedElectionId(allElectionsForResults[0].id);
    }
  }, [allElectionsForResults, selectedElectionId]);

  useEffect(() => {
    if (selectedElectionId) {
      const electionResults = getElectionResults(selectedElectionId);
      setResults(electionResults);
    }
  }, [selectedElectionId, getElectionResults]);

  const electionOptions = allElectionsForResults.map(e => ({
    value: e.id,
    label: e.title,
  }));

  const getBarWidth = (percentage: number) => `${Math.max(percentage, 5)}%`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Результаты голосований</h1>
        <p className={styles.subtitle}>Итоги выборов в органы студенческого самоуправления</p>
      </div>

      <Card className={styles.toolbar}>
        <label className={styles.selectLabel}>Выберите голосование:</label>
        <Select
          options={electionOptions}
          value={selectedElectionId}
          onChange={(e) => setSelectedElectionId(e.target.value)}
          className={styles.electionSelect}
        />
      </Card>

      {electionsLoading ? (
        <Card className={styles.loading}>Загрузка...</Card>
      ) : !results ? (
        <Card className={styles.empty}>
          <p>Выберите голосование для просмотра результатов</p>
        </Card>
      ) : (
        <>
          <Card className={styles.summaryCard}>
            <h2>{results.electionTitle}</h2>
            <div className={styles.summaryStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{results.totalVotes}</span>
                <span className={styles.statLabel}>Голосов подано</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{results.turnoutPercentage}%</span>
                <span className={styles.statLabel}>Явка</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{results.candidateResults.length}</span>
                <span className={styles.statLabel}>Кандидатов</span>
              </div>
            </div>
          </Card>

          <Card className={styles.resultsCard}>
            <h3>Результаты по кандидатам</h3>
            <div className={styles.resultsTable}>
              {results.candidateResults.map((candidate, index) => (
                <div key={candidate.candidateId} className={styles.resultRow}>
                  <div className={styles.rank}>
                    {index === 0 && results.totalVotes > 0 ? (
                      <Badge variant="success">🏆</Badge>
                    ) : (
                      <span className={styles.rankNumber}>#{index + 1}</span>
                    )}
                  </div>
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateName}>{candidate.candidateName}</span>
                    <span className={styles.candidatePosition}>{candidate.position}</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.bar} 
                      style={{ width: getBarWidth(candidate.percentage) }}
                    />
                  </div>
                  <div className={styles.voteInfo}>
                    <span className={styles.voteCount}>{candidate.votesCount}</span>
                    <span className={styles.votePercent}>{candidate.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
});
