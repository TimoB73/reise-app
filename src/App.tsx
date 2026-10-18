import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Info from './pages/Info'

const WalkHighlights = lazy(() => import('./pages/WalkHighlights'))
const Food = lazy(() => import('./pages/Food'))
const PlaceSearch = lazy(() => import('./pages/PlaceSearch'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="zu-fuss" element={<WalkHighlights />} />
        <Route path="essen" element={<Food />} />
        <Route path="ort" element={<PlaceSearch />} />
        <Route path="info" element={<Info />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
