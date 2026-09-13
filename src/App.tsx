import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Forecast from './pages/Forecast'
import Journal from './pages/Journal'
import Chart from './pages/Chart'
import Learn from './pages/Learn'
import ArticlePage from './pages/ArticlePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Forecast />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/chart" element={<Chart />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:slug" element={<ArticlePage />} />
      </Route>
    </Routes>
  )
}

