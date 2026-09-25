import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import OnboardingTour from './components/OnboardingTour'
import RequireAccount from './components/RequireAccount'

// Lazy loaded pages
const Forecast = lazy(() => import('./pages/Forecast'))
const Journal = lazy(() => import('./pages/Journal'))
const Chart = lazy(() => import('./pages/Chart'))
const Learn = lazy(() => import('./pages/Learn'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Patterns = lazy(() => import('./pages/Patterns'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Admin = lazy(() => import('./pages/Admin'))
const Breathe = lazy(() => import('./pages/Breathe'))
const Synastry = lazy(() => import('./pages/Synastry'))
const Companion = lazy(() => import('./pages/Companion'))

// Import your new landing page (adjust the path if you saved it in /pages instead of /components)
const LandingPage = lazy(() => import('./components/LandingPage'))

function RouteFallback() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-24 text-center">
      <p className="text-sm text-[#8e85a8]">One moment…</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <OnboardingTour />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:slug" element={<ArticlePage />} />

            {/* Protected App Routes */}
            <Route
              path="/forecast"
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
              path="/companion"
              element={
                <RequireAccount>
                  <Companion />
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
              path="/admin"
              element={
                <RequireAccount>
                  <Admin />
                </RequireAccount>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
