import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import OnboardingTour from './components/OnboardingTour'
import RequireAccount from './components/RequireAccount'
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

// Everything except signing in, signing up and the pricing page needs an
// account. Pricing stays open so someone deciding whether to sign up can still
// see what the tiers cost before committing.
export default function App() {
  return (
    <AuthProvider>
      <OnboardingTour />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route
            path="/"
            element={
              <RequireAccount>
                <Forecast />
              </RequireAccount>
            }
          />
          <Route
            path="/journal"
            element={
              <RequireAccount>
                <Journal />
              </RequireAccount>
            }
          />
          <Route
            path="/chart"
            element={
              <RequireAccount>
                <Chart />
              </RequireAccount>
            }
          />
          <Route
            path="/breathe"
            element={
              <RequireAccount>
                <Breathe />
              </RequireAccount>
            }
          />
          <Route
            path="/synastry"
            element={
              <RequireAccount>
                <Synastry />
              </RequireAccount>
            }
          />
          <Route
            path="/patterns"
            element={
              <RequireAccount>
                <Patterns />
              </RequireAccount>
            }
          />
          <Route
            path="/learn"
            element={
              <RequireAccount>
                <Learn />
              </RequireAccount>
            }
          />
          <Route
            path="/learn/:slug"
            element={
              <RequireAccount>
                <ArticlePage />
              </RequireAccount>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAccount>
                <Admin />
              </RequireAccount>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
