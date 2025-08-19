import React, { useState } from 'react'
import { useFence } from '../contexts/FenceContext'
import { Calculator, Package, Ruler, Settings, Download, Info } from 'lucide-react'

const PriceCalculator: React.FC = () => {
  const { state } = useFence()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [installationCost, setInstallationCost] = useState(30) // zł/m²
  const [materialMarkup, setMaterialMarkup] = useState(25) // %

  const calculateTotals = () => {
    const totals = {
      posts: { count: 0, price: 0, total: 0, material: 0, installation: 0 },
      gates: { count: 0, price: 0, total: 0, material: 0, installation: 0 },
      doors: { count: 0, price: 0, total: 0, material: 0, installation: 0 },
      sections: { count: 0, length: 0, price: 0, total: 0, material: 0, installation: 0 }
    }

    state.elements.forEach(element => {
      switch (element.type) {
        case 'post':
          totals.posts.count++
          totals.posts.price = 45 // Cena materiału
          totals.posts.material += 45
          totals.posts.installation += 25 // Montaż słupka
          totals.posts.total += 70
          break
        case 'gate':
          totals.gates.count++
          totals.gates.price = 850 // Cena materiału
          totals.gates.material += 850
          totals.gates.installation += 150 // Montaż bramy
          totals.gates.total += 1000
          break
        case 'door':
          totals.doors.count++
          totals.doors.price = 450 // Cena materiału
          totals.doors.material += 450
          totals.doors.installation += 75 // Montaż furtki
          totals.doors.total += 525
          break
        case 'section':
          totals.sections.count++
          totals.sections.length += element.width
          totals.sections.price = 75 // Cena za m²
          totals.sections.material += element.width * 75
          totals.sections.installation += element.width * installationCost
          totals.sections.total += element.width * (75 + installationCost)
          break
      }
    })

    return totals
  }

  const totals = calculateTotals()
  const materialTotal = totals.posts.material + totals.gates.material + totals.doors.material + totals.sections.material
  const installationTotal = totals.posts.installation + totals.gates.installation + totals.doors.installation + totals.sections.installation
  const subtotal = materialTotal + installationTotal
  const markup = subtotal * (materialMarkup / 100)
  const grandTotal = subtotal + markup

  const calculatePerimeter = () => {
    if (state.elements.length === 0) return 0
    
    // Oblicz obwód na podstawie pozycji elementów
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    
    state.elements.forEach(element => {
      minX = Math.min(minX, element.position.x)
      maxX = Math.max(maxX, element.position.x + element.width)
      minZ = Math.min(minZ, element.position.z)
      maxZ = Math.max(maxZ, element.position.z)
    })
    
    const width = maxX - minX
    const depth = maxZ - minZ
    return 2 * (width + depth)
  }

  const perimeter = calculatePerimeter()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Kalkulator cen ogrodzeń
          </h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Ustawienia zaawansowane"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Ustawienia zaawansowane */}
      {showAdvanced && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Ustawienia cenowe</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Koszt montażu (zł/m²)</label>
              <input
                type="number"
                value={installationCost}
                onChange={(e) => setInstallationCost(Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                min="0"
                step="5"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Marża materiałowa (%)</label>
              <input
                type="number"
                value={materialMarkup}
                onChange={(e) => setMaterialMarkup(Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                min="0"
                max="100"
                step="5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Statystyki ogrodzenia */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-blue-700">Obwód</span>
          </div>
          <p className="text-lg font-bold text-blue-800">{perimeter.toFixed(1)} m</p>
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-700">Elementy</span>
          </div>
          <p className="text-lg font-bold text-green-800">{state.elements.length}</p>
        </div>
      </div>

      {/* Lista materiałowa */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700">Lista materiałowa</h4>
        
        {totals.posts.count > 0 && (
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Słupki</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{totals.posts.count} × 70 zł</p>
              <p className="text-xs text-gray-500">Materiał: {totals.posts.material} zł</p>
              <p className="text-xs text-gray-500">Montaż: {totals.posts.installation} zł</p>
              <p className="text-sm font-bold">{totals.posts.total} zł</p>
            </div>
          </div>
        )}

        {totals.gates.count > 0 && (
          <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Bramy</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{totals.gates.count} × 1000 zł</p>
              <p className="text-xs text-gray-500">Materiał: {totals.gates.material} zł</p>
              <p className="text-xs text-gray-500">Montaż: {totals.gates.installation} zł</p>
              <p className="text-sm font-bold">{totals.gates.total} zł</p>
            </div>
          </div>
        )}

        {totals.doors.count > 0 && (
          <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Furtki</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{totals.doors.count} × 525 zł</p>
              <p className="text-xs text-gray-500">Materiał: {totals.doors.material} zł</p>
              <p className="text-xs text-gray-500">Montaż: {totals.doors.installation} zł</p>
              <p className="text-sm font-bold">{totals.doors.total} zł</p>
            </div>
          </div>
        )}

        {totals.sections.count > 0 && (
          <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Przęsła</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {totals.sections.length.toFixed(1)}m × {(75 + installationCost).toFixed(0)} zł/m
              </p>
              <p className="text-xs text-gray-500">Materiał: {totals.sections.material} zł</p>
              <p className="text-xs text-gray-500">Montaż: {totals.sections.installation} zł</p>
              <p className="text-sm font-bold">{totals.sections.total} zł</p>
            </div>
          </div>
        )}
      </div>

      {/* Szczegółowe podsumowanie */}
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Materiały:</span>
            <span className="font-medium">{materialTotal.toFixed(2)} zł</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montaż:</span>
            <span className="font-medium">{installationTotal.toFixed(2)} zł</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Podsuma:</span>
            <span className="font-medium">{subtotal.toFixed(2)} zł</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Marża ({materialMarkup}%):</span>
            <span className="font-medium">{markup.toFixed(2)} zł</span>
          </div>
        </div>

        {/* Suma całkowita */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-800">Suma całkowita:</span>
            <span className="text-2xl font-bold text-green-800">{grandTotal.toFixed(2)} zł</span>
          </div>
          
          {state.selectedSystem && (
            <p className="text-xs text-green-600 mt-1">
              System: {state.selectedSystem.name}
            </p>
          )}
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="h-4 w-4" />
          <span className="text-sm">PDF</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Calculator className="h-4 w-4" />
          <span className="text-sm">Wyślij ofertę</span>
        </button>
      </div>

      {/* Informacje dodatkowe */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <h5 className="text-sm font-medium text-blue-800">Informacje o cenach</h5>
        </div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Ceny zawierają materiały i montaż</li>
          <li>• Słupki: 45 zł + 25 zł montaż</li>
          <li>• Bramy: 850 zł + 150 zł montaż</li>
          <li>• Furtki: 450 zł + 75 zł montaż</li>
          <li>• Przęsła: 75 zł/m² + {installationCost} zł/m² montaż</li>
          <li>• Marża materiałowa: {materialMarkup}%</li>
        </ul>
      </div>
    </div>
  )
}

export default PriceCalculator
