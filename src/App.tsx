import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, ElectionsPage, CandidatesPage, ResultsPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'elections':
      return <ElectionsPage />;
    case 'candidates':
      return <CandidatesPage />;
    case 'results':
      return <ResultsPage />;
    case 'admin':
    case 'admin-elections':
    case 'admin-candidates':
      return <AdminPage />;
    default:
      return <HomePage />;
  }
});

const App = observer(() => {
  useEffect(() => {
    dataStore.loadAllData();
  }, []);

  return (
    <>
      <MainLayout>
        <PageRouter />
      </MainLayout>

      <LoginModal />
      <ConfirmModal />
      <Toast />
    </>
  );
});

export default App;
