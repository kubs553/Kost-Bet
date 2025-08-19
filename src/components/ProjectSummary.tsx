import React from 'react'
import { useFence } from '../contexts/FenceContext'
import { FileText, Download, Share2, Calendar, MapPin } from 'lucide-react'

interface ProjectSummaryProps {
  onReset: () => void
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({ onReset }) => {
  const { state } = useFence()

  const calculateProjectStats = () => {
    const stats = {
      totalLength: 0,
      totalArea: 0,
      posts: 0,
      gates: 0,
      doors: 0,
      sections: 0
    }

    state.elements.forEach(element => {
      switch (element.type) {
        case 'post':
          stats.posts++
          break
        case 'gate':
          stats.gates++
          break
        case 'door':
          stats.doors++
          break
        case 'section':
          stats.sections++
          stats.totalLength += element.width
          stats.totalArea += element.width * element.height
          break
      }
    })

    return stats
  }

  const stats = calculateProjectStats()

  const generateQuote = () => {
    const quoteData = {
      projectName: `Ogrodzenie - ${new Date().toLocaleDateString('pl-PL')}`,
      customer: 'Klient',
      date: new Date().toLocaleDateString('pl-PL'),
      system: state.selectedSystem?.name || 'Nie wybrano',
      elements: state.elements,
      stats: stats,
      totalPrice: state.totalPrice
    }

    // Tutaj można dodać logikę generowania PDF lub wysyłania oferty
    console.log('📋 Generuję ofertę:', quoteData)
    alert('Funkcja generowania oferty będzie dostępna wkrótce!')
  }

  const exportProject = () => {
    const projectData = {
      name: `Projekt ogrodzenia - ${new Date().toLocaleDateString('pl-PL')}`,
      system: state.selectedSystem,
      houseStyle: state.selectedHouseStyle,
      elements: state.elements,
      stats: stats,
      totalPrice: state.totalPrice,
      exportDate: new Date().toISOString()
    }

    const dataStr = JSON.stringify(projectData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `projekt-ogrodzenia-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Podsumowanie projektu
        </h3>
      </div>

      {/* Informacje o projekcie */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Utworzono: {new Date().toLocaleDateString('pl-PL')}</span>
        </div>
        
        {state.selectedSystem && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>System: {state.selectedSystem.name}</span>
          </div>
        )}
      </div>

      {/* Statystyki projektu */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">Długość</div>
          <div className="text-lg font-bold text-blue-800">{stats.totalLength.toFixed(1)} m</div>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-600 mb-1">Powierzchnia</div>
          <div className="text-lg font-bold text-green-800">{stats.totalArea.toFixed(1)} m²</div>
        </div>
      </div>

      {/* Lista elementów */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-700">Elementy projektu</h4>
        
        {stats.posts > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Słupki:</span>
            <span className="font-medium">{stats.posts} szt.</span>
          </div>
        )}
        
        {stats.gates > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Bramy:</span>
            <span className="font-medium">{stats.gates} szt.</span>
          </div>
        )}
        
        {stats.doors > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Furtki:</span>
            <span className="font-medium">{stats.doors} szt.</span>
          </div>
        )}
        
        {stats.sections > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Przęsła:</span>
            <span className="font-medium">{stats.sections} szt.</span>
          </div>
        )}
      </div>

      {/* Cena całkowita */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-green-800">Cena całkowita:</span>
          <span className="text-2xl font-bold text-green-800">{state.totalPrice.toFixed(2)} zł</span>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="space-y-2">
        <button
          onClick={generateQuote}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Share2 className="h-4 w-4" />
          <span>Generuj ofertę</span>
        </button>
        
        <button
          onClick={exportProject}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
          <span>Eksportuj projekt</span>
        </button>
        
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <FileText className="h-4 w-4" />
          <span>Resetuj projekt</span>
        </button>
      </div>

      {/* Informacje dodatkowe */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="text-sm font-medium text-gray-800 mb-2">O projekcie</h5>
        <p className="text-xs text-gray-600">
          Projekt zawiera {state.elements.length} elementów ogrodzeniowych o łącznej długości {stats.totalLength.toFixed(1)}m. 
          Możesz eksportować projekt lub wygenerować ofertę cenową.
        </p>
      </div>
    </div>
  )
}

export default ProjectSummary
