import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout, FenceConfigurator } from './components'
import { FenceProvider } from './contexts/FenceContext'

function App() {
  const handleReset = () => {
    // Callback który będzie wywoływany przy resetowaniu projektu
    // Możemy tu dodać logikę czyszczenia sceny 3D
    console.log('🔄 Projekt został zresetowany - scena 3D powinna zostać wyczyszczona')
  }

  return (
    <Router>
      <FenceProvider onReset={handleReset}>
        <Layout>
          <Routes>
            <Route path="/" element={<FenceConfigurator />} />
          </Routes>
        </Layout>
      </FenceProvider>
    </Router>
  )
}

export default App
