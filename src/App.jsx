import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Loja = lazy(() => import('./pages/Loja'))
const Fechamento = lazy(() => import('./pages/Fechamento'))
const Settings = lazy(() => import('./pages/Settings'))
const Inventario = lazy(() => import('./pages/Inventario'))
const GerenciarInventario = lazy(() => import('./pages/GerenciarInventario'))
const GerenciarUsuarios = lazy(() => import('./pages/GerenciarUsuarios'))
const FechamentoFuncionario = lazy(() => import('./pages/FechamentoFuncionario'))
const DetalhesFechamentoFuncionario = lazy(() => import('./pages/DetalhesFechamentoFuncionario'))

function AppRoutes() {
  const { user, loading } = useAuth()
  const { dark } = useTheme()

  if (loading) {
    return (
      <div className={`${dark ? 'bg-purple-950' : 'bg-purple-50'} min-h-screen flex items-center justify-center`}>
        <div className="text-purple-400 text-lg font-semibold animate-pulse">Klosr Finance...</div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className={`${dark ? 'bg-purple-950' : 'bg-purple-50'} min-h-screen flex items-center justify-center`}>
        <div className="text-purple-400 text-lg font-semibold animate-pulse">Klosr Finance...</div>
      </div>
    }>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/loja/:id" element={user ? <Loja /> : <Navigate to="/" />} />
        <Route path="/loja/:id/fechamento/:dia" element={user ? <Fechamento /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        <Route path="/inventario" element={user ? <Inventario /> : <Navigate to="/" />} />
        <Route path="/loja/:id/inventario" element={user ? <GerenciarInventario /> : <Navigate to="/" />} />
        <Route path="/usuarios" element={user ? <GerenciarUsuarios /> : <Navigate to="/" />} />
        <Route path="/loja/:id/meu-fechamento/:dia" element={user ? <FechamentoFuncionario /> : <Navigate to="/" />} />
        <Route path="/loja/:id/fechamento-funcionario/:fechamentoId" element={user ? <DetalhesFechamentoFuncionario /> : <Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App