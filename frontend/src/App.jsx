import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layout/DashboardLayout';
import Placeholder from './pages/Placeholder';
import Dashboard from './pages/Dashboard';
import Treinos from './pages/Treinos';
import Perfil from './pages/Perfil';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import SemPermissao from './pages/SemPermissao';
import AdminAlunos from './pages/AdminAlunos';
import AdminPrescricao from './pages/AdminPrescricao';
import Welcome from './pages/Welcome';

// Componente para proteger rotas privadas
const ProtectedRoute = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50"><span className="text-gray-500 font-bold">Carregando...</span></div>;
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para proteger rotas Admin
const AdminRoute = ({ children }) => {
  const { user, signed, loading } = useAuth();
  
  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 sm:hidden"><span className="text-gray-500 font-bold">Autenticando...</span></div>;
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <SemPermissao />;
  }

  return children;
};

// Componente principal contendo as rotas
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Rotas Privadas */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Welcome />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="treinos" element={<Treinos />} />
        <Route path="perfil" element={<Perfil />} />
        
        {/* Rotas Administrativas Envolvidas no Layout */}
        <Route path="admin/alunos" element={<AdminRoute><AdminAlunos /></AdminRoute>} />
        <Route path="admin/prescricao/:id" element={<AdminRoute><AdminPrescricao /></AdminRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
