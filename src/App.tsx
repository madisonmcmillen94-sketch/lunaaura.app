import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import OnboardingTour from './components/OnboardingTour'
import Forecast from './pages/Forecast'
import Journal from './pages/Journal'
import Chart from './pages/Chart'
import Learn from './pages/Learn'
import ArticlePage from './pages/ArticlePage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Patterns from './pages/Patterns'
import Pricing from './pages/Pricing'
import Admin from './pages/Admin'
import Breathe from './pages/Breathe'
import Synastry from './pages/Synastry'

export default function App() {
  return (
    <AuthProvider>
      <OnboardingTour />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Forecast />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/chart" element={<Chart />} />
          <Route path="/breathe" element={<Breathe />} />
          <Route path="/synastry" element={<Synastry />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<ArticlePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
