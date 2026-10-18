import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Info from './pages/Info'

const WalkHighlights = lazy(() => import('./pages/WalkHighlights'))
const Food = lazy(() => import('./pages/Food'))
const PlaceSearch = lazy(() => import('./pages/PlaceSearch'))
const TripPage = lazy(() => import('./pages/TripPage'))
const TripNew = lazy(() => import('./pages/TripNew'))
const TripJoin = lazy(() => import('./pages/TripJoin'))
const Favorites = lazy(() => import('./pages/Favorites'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="zu-fuss" element={<WalkHighlights />} />
        <Route path="essen" element={<Food />} />
        <Route path="ort" element={<PlaceSearch />} />
        <Route path="reise" element={<TripPage />} />
        <Route path="reise/neu" element={<TripNew />} />
        <Route path="reise/beitreten" element={<TripJoin />} />
        <Route path="merkliste" element={<Favorites />} />
        <Route path="info" element={<Info />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
