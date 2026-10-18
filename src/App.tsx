import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Info from './pages/Info'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="info" element={<Info />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
