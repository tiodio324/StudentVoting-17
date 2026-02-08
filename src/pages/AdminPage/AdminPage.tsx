import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Election, Candidate, ElectionFormData, CandidateFormData, ElectionStatus } from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'elections' | 'candidates';

export const AdminPage = observer(() => {
  const { 
    elections, 
    candidates,
    activeElections,
    createElection,
    updateElection,
    updateElectionStatus,
    deleteElection,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getElectionById,
    loadAllData,
    electionsLoading,
    candidatesLoading
  } = dataStore;

  const [activeTab, setActiveTab] = useState<AdminTab>('elections');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [electionForm, setElectionForm] = useState<ElectionFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    maxVotesPerVoter: 1,
    isAnonymous: true,
  });

  const [candidateForm, setCandidateForm] = useState<CandidateFormData>({
    electionId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    program: '',
    photoUrl: '',
  });

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const resetForms = () => {
    setElectionForm({
      title: '', description: '', startDate: '', endDate: '',
      maxVotesPerVoter: 1, isAnonymous: true,
    });
    setCandidateForm({
      electionId: '', firstName: '', lastName: '', middleName: '',
      position: '', program: '', photoUrl: '',
    });
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForms();
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (item: Election | Candidate) => {
    setModalMode('edit');
    setEditingId(item.id);
    
    if (activeTab === 'elections') {
      const e = item as Election;
      setElectionForm({
        title: e.title,
        description: e.description,
        startDate: e.startDate.split('T')[0],
        endDate: e.endDate.split('T')[0],
        maxVotesPerVoter: e.maxVotesPerVoter,
        isAnonymous: e.isAnonymous,
      });
    } else {
      const c = item as Candidate;
      setCandidateForm({
        electionId: c.electionId,
        firstName: c.firstName,
        lastName: c.lastName,
        middleName: c.middleName || '',
        position: c.position,
        program: c.program,
        photoUrl: c.photoUrl || '',
      });
    }
    
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'elections') {
        if (!electionForm.title || !electionForm.startDate || !electionForm.endDate) {
          uiStore.showError('Заполните обязательные поля');
          return;
        }
        if (modalMode === 'create') {
          await createElection(electionForm);
        } else if (editingId) {
          await updateElection(editingId, electionForm);
        }
      } else {
        if (!candidateForm.firstName || !candidateForm.lastName || !candidateForm.electionId || !candidateForm.position) {
          uiStore.showError('Заполните обязательные поля');
          return;
        }
        if (modalMode === 'create') {
          await createCandidate(candidateForm);
        } else if (editingId) {
          await updateCandidate(editingId, candidateForm);
        }
      }
      
      uiStore.showSuccess(modalMode === 'create' ? 'Запись добавлена' : 'Запись обновлена');
      setModalOpen(false);
      resetForms();
    } catch {
      uiStore.showError('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    uiStore.showConfirm(
      'Удаление записи',
      'Вы уверены, что хотите удалить эту запись?',
      async () => {
        if (activeTab === 'elections') {
          await deleteElection(id);
        } else {
          await deleteCandidate(id);
        }
        uiStore.showSuccess('Запись удалена');
      }
    );
  };

  const handleStatusChange = async (id: string, status: ElectionStatus) => {
    await updateElectionStatus(id, status);
    uiStore.showSuccess('Статус обновлён');
  };

  const electionOptions = activeElections.map(e => ({ value: e.id, label: e.title }));
  const statusOptions = [
    { value: 'draft', label: 'Черновик' },
    { value: 'upcoming', label: 'Предстоящие' },
    { value: 'active', label: 'Активно' },
    { value: 'completed', label: 'Завершено' },
    { value: 'cancelled', label: 'Отменено' },
  ];

  const electionColumns: TableColumn<Election>[] = [
    { key: 'title', title: 'Название' },
    { 
      key: 'status', 
      title: 'Статус',
      width: '150px',
      render: (v: unknown, row: Election) => (
        <Select
          options={statusOptions}
          value={v as string}
          onChange={(e) => handleStatusChange(row.id, e.target.value as ElectionStatus)}
          className={styles.statusSelect}
        />
      )
    },
    { key: 'startDate', title: 'Начало', width: '120px', render: (v: unknown) => new Date(v as string).toLocaleDateString('ru-RU') },
    { key: 'endDate', title: 'Окончание', width: '120px', render: (v: unknown) => new Date(v as string).toLocaleDateString('ru-RU') },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Election) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} aria-label="Редактировать">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} aria-label="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </Button>
        </div>
      ),
    },
  ];

  const candidateColumns: TableColumn<Candidate>[] = [
    { key: 'lastName', title: 'Фамилия' },
    { key: 'firstName', title: 'Имя' },
    { key: 'position', title: 'Должность' },
    { key: 'electionId', title: 'Выборы', render: (v: unknown) => getElectionById(v as string)?.title || '—' },
    { key: 'votesCount', title: 'Голосов', width: '80px' },
    {
      key: 'actions',
      title: '',
      width: '100px',
      render: (_: unknown, row: Candidate) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => openEditModal(row)} aria-label="Редактировать">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} aria-label="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </Button>
        </div>
      ),
    },
  ];

  const getModalTitle = () => {
    const action = modalMode === 'create' ? 'Добавить' : 'Редактировать';
    const entity = activeTab === 'elections' ? 'выборы' : 'кандидата';
    return `${action} ${entity}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление</h1>
        <p className={styles.subtitle}>Управление выборами и кандидатами</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'elections' ? styles.active : ''}`} onClick={() => setActiveTab('elections')}>
          Выборы
        </button>
        <button className={`${styles.tab} ${activeTab === 'candidates' ? styles.active : ''}`} onClick={() => setActiveTab('candidates')}>
          Кандидаты
        </button>
      </div>

      <Card className={styles.toolbar}>
        <Button variant="primary" onClick={openCreateModal}>
          Добавить {activeTab === 'elections' ? 'выборы' : 'кандидата'}
        </Button>
      </Card>

      <Card padding="none">
        {activeTab === 'elections' && (
          <Table columns={electionColumns} data={elections.filter(e => e.isActive)} keyField="id" loading={electionsLoading} emptyText="Нет выборов" />
        )}
        {activeTab === 'candidates' && (
          <Table columns={candidateColumns} data={candidates.filter(c => c.isActive)} keyField="id" loading={candidatesLoading} emptyText="Нет кандидатов" />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={getModalTitle()}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={handleSave}>Сохранить</Button>
          </div>
        }
      >
        <div className={styles.form}>
          {activeTab === 'elections' && (
            <>
              <Input label="Название *" value={electionForm.title} onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })} />
              <Input label="Описание" value={electionForm.description} onChange={(e) => setElectionForm({ ...electionForm, description: e.target.value })} />
              <Input label="Дата начала *" type="date" value={electionForm.startDate} onChange={(e) => setElectionForm({ ...electionForm, startDate: e.target.value })} />
              <Input label="Дата окончания *" type="date" value={electionForm.endDate} onChange={(e) => setElectionForm({ ...electionForm, endDate: e.target.value })} />
              <Input label="Макс. голосов на избирателя" type="number" min={1} value={electionForm.maxVotesPerVoter} onChange={(e) => setElectionForm({ ...electionForm, maxVotesPerVoter: parseInt(e.target.value) || 1 })} />
            </>
          )}
          {activeTab === 'candidates' && (
            <>
              <Select label="Выборы *" options={electionOptions} value={candidateForm.electionId} onChange={(e) => setCandidateForm({ ...candidateForm, electionId: e.target.value })} />
              <Input label="Фамилия *" value={candidateForm.lastName} onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })} />
              <Input label="Имя *" value={candidateForm.firstName} onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })} />
              <Input label="Отчество" value={candidateForm.middleName} onChange={(e) => setCandidateForm({ ...candidateForm, middleName: e.target.value })} />
              <Input label="Должность *" value={candidateForm.position} onChange={(e) => setCandidateForm({ ...candidateForm, position: e.target.value })} />
              <Input label="Программа" value={candidateForm.program} onChange={(e) => setCandidateForm({ ...candidateForm, program: e.target.value })} />
              <Input label="URL фото" value={candidateForm.photoUrl} onChange={(e) => setCandidateForm({ ...candidateForm, photoUrl: e.target.value })} />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
});
