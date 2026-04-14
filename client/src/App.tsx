import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Navbar } from './components/Navbar';

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--brand)',
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏛</div>
          <div className="spinner" style={{
            margin: '0 auto',
            borderTopColor: '#fff',
            borderColor: 'rgba(255,255,255,0.3)',
          }} />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <>
      <Navbar />
      {user.role === 'admin' ? <AdminDashboard /> : <CitizenDashboard />}
    </>
  );
};

export default App;