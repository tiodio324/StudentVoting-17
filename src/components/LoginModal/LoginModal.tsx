import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/store';
import { UserRole } from '@/types';
import { Modal, Button, Input } from '@/components/UI';
import styles from './LoginModal.module.scss';

type LoginRole = Exclude<UserRole, 'voter'>;

export const LoginModal = observer(() => {
  const {
    loginModalOpen,
    closeLoginModal,
    loginStaff,
    loginVoter,
    registerVoter,
    loginError,
    isLoading,
    authModalTab,
    voterAuthMode,
    setAuthModalTab,
    setVoterAuthMode,
  } = authStore;

  const [selectedRole, setSelectedRole] = useState<LoginRole>('moderator');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const resetForm = () => {
    setPassword('');
    setEmail('');
    setName('');
    setSelectedRole('moderator');
  };

  const handleClose = () => {
    closeLoginModal();
    resetForm();
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginStaff(selectedRole, password);
    if (!authStore.loginError) {
      resetForm();
    }
  };

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (voterAuthMode === 'register') {
      await registerVoter(email, password, name);
    } else {
      await loginVoter(email, password);
    }
    if (!authStore.loginError) {
      resetForm();
    }
  };

  return (
    <Modal
      isOpen={loginModalOpen}
      onClose={handleClose}
      title="Вход в систему"
      size="sm"
    >
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${authModalTab === 'voter' ? styles.active : ''}`}
          onClick={() => setAuthModalTab('voter')}
        >
          Избиратель
        </button>
        <button
          type="button"
          className={`${styles.tab} ${authModalTab === 'staff' ? styles.active : ''}`}
          onClick={() => setAuthModalTab('staff')}
        >
          Персонал
        </button>
      </div>

      {authModalTab === 'voter' ? (
        <form onSubmit={handleVoterSubmit} className={styles.form}>
          <div className={styles.modeSelector}>
            <button
              type="button"
              className={`${styles.modeButton} ${voterAuthMode === 'login' ? styles.active : ''}`}
              onClick={() => setVoterAuthMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${voterAuthMode === 'register' ? styles.active : ''}`}
              onClick={() => setVoterAuthMode('register')}
            >
              Регистрация
            </button>
          </div>

          {voterAuthMode === 'register' && (
            <Input
              type="text"
              label="ФИО"
              placeholder="Введите ваше ФИО"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}

          <Input
            type="email"
            label="Email"
            placeholder="example@mail.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus={voterAuthMode === 'login'}
          />

          <Input
            type="password"
            label="Пароль"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={loginError || undefined}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={!email || !password || (voterAuthMode === 'register' && !name)}
          >
            {voterAuthMode === 'register' ? 'Зарегистрироваться' : 'Войти'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleStaffSubmit} className={styles.form}>
          <div className={styles.roleSelector}>
            <button
              type="button"
              className={`${styles.roleButton} ${selectedRole === 'moderator' ? styles.active : ''}`}
              onClick={() => setSelectedRole('moderator')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Модератор</span>
            </button>
            <button
              type="button"
              className={`${styles.roleButton} ${selectedRole === 'admin' ? styles.active : ''}`}
              onClick={() => setSelectedRole('admin')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              <span>Администратор</span>
            </button>
          </div>

          <Input
            type="password"
            label="Пароль"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={loginError || undefined}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={!password}
          >
            Войти
          </Button>
        </form>
      )}
    </Modal>
  );
});
