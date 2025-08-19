import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { ColladaLoader } from 'three-stdlib'
import { getFenceConfig } from '../config/fenceConfigs'

interface FenceElement {
  id: string
  type: 'post' | 'gate' | 'section' | 'door'
  position: { x: number; z: number }
  width?: number
  height?: number
}

interface FenceSystem {
  id: string
  name: string
  objFile: string
  mtlFile: string
  textureFile: string
  basePrice: number
}

interface HouseStyle {
  id: string
  name: string
  model: string
}

interface ThreeJSCanvas3DProps {
  elements: FenceElement[]
  selectedElementId: string | null
  onElementSelect: (id: string) => void
  fenceSystem: FenceSystem | null
  houseStyle: HouseStyle | null
  onReset: () => void
  selectedFence?: any
  viewMode: '2D' | '3D'
  resetCounter: number
}

const ThreeJSCanvas3D: React.FC<ThreeJSCanvas3DProps> = ({
  elements,
  selectedElementId,
  onElementSelect,
  fenceSystem,
  houseStyle,
  onReset,
  selectedFence,
  viewMode,
  resetCounter
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const raycasterRef = useRef<THREE.Raycaster | null>(null)
  const mouseRef = useRef<THREE.Vector2 | null>(null)
  
  // Referencje do elementów 3D
  const elements3DRef = useRef<Map<string, THREE.Group>>(new Map())
  
  // 🎯 Referencja do załadowanego modelu DAE
  const daeModelRef = useRef<THREE.Scene | null>(null)
  
  // 🚀 CACHE: Cache dla załadowanych tekstur (znacznie przyspiesza ładowanie)
  const textureCache = useRef<Map<string, any>>(new Map())
  
  // Sprawdzanie plików PNG (tekstur)
  const checkPngFiles = async () => {
    if (!selectedFence?.texturePath) return false
    
    try {
      const response = await fetch(selectedFence.texturePath)
      return response.ok
    } catch (error) {
      console.error('❌ Błąd sprawdzania tekstury:', error)
      return false
    }
  }
  
  // Inicjalizacja sceny
  const initScene = () => {
    if (!containerRef.current) return
    
    // Scena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Kolor nieba
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200) // Mgła dla głębi
    sceneRef.current = scene
    
    // Kamera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 4, 6) // Bardzo blisko i nisko (było 0, 6, 8)
    cameraRef.current = camera
    
    // 🌟 Ultra wysokiej jakości renderer PBR
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping // Filmowy ton mapping
    renderer.toneMappingExposure = 1.2 // Ekspozycja
    renderer.outputColorSpace = THREE.SRGBColorSpace // Prawidłowa przestrzeń kolorów
    renderer.shadowMap.autoUpdate = true
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    // 🌟 Dodaj environment mapping dla ultra realistycznych odbić
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    
    // 🎯 Utwórz environment map z koloru nieba
    const envMap = pmremGenerator.fromScene(new THREE.Scene()).texture
    scene.environment = envMap
    
    console.log('🌟 Environment mapping dodany dla ultra realistycznych odbić')
    
    // Kontrolki kamery
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    
    // 🎯 USTAWIAM OGRANICZENIA KAMERY - NIE MOŻNA WCHODZIĆ W ELEMENTY
    controls.minDistance = 2.0 // Minimalna odległość od targetu - kamera nie może wchodzić w elementy
    controls.maxDistance = Infinity // Maksymalna odległość - bez limitu
    
    // 🎯 BLOKUJĘ RUCH NAD ZIEMIĘ - KAMERA MOŻE IŚĆ TYLKO POD ZIEMIĄ
    controls.minPolarAngle = 0 // Minimalny kąt - 0° (pod ziemią) - MOŻNA iść pod ziemię
    controls.maxPolarAngle = Math.PI / 2 // Maksymalny kąt - 90° (poziom) - NIE MOŻNA iść nad ziemię
    
    // 🎯 WYŁĄCZAM OGRANICZENIA AZYMUTU - PEŁNY OBROT POZIOMY
    controls.minAzimuthAngle = -Infinity // Minimalny kąt azymutu - bez limitu
    controls.maxAzimuthAngle = Infinity // Maksymalny kąt azymutu - bez limitu
    
    // 🎯 DODATKOWE USTAWIENIA DLA PEŁNEJ SWOBODY
    controls.enablePan = true // Włącz przesuwanie kamery
    controls.enableZoom = true // Włącz przybliżanie/oddalanie
    controls.enableRotate = true // Włącz obracanie kamery
    
    // 🎯 DODATKOWE OGRANICZENIA DLA BEZPIECZEŃSTWA
    controls.zoomSpeed = 0.5 // Zmniejsz prędkość zoom (bardziej kontrolowane)
    
    console.log('🎯 Zablokowano ruch nad ziemię - kamera może iść tylko pod ziemię')
    console.log('🎯 minPolarAngle:', controls.minPolarAngle)
    console.log('🎯 maxPolarAngle:', controls.maxPolarAngle)
    console.log('🎯 minDistance:', controls.minDistance)
    console.log('🎯 maxDistance:', controls.maxDistance)
    
    controlsRef.current = controls
    
    // 🌟 Ultra realistyczne oświetlenie PBR
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4) // Mniejsze ambient dla lepszych cieni
    scene.add(ambientLight)
    
    // 🎯 Główne światło kierunkowe (słońce)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -25
    directionalLight.shadow.camera.right = 25
    directionalLight.shadow.camera.top = 25
    directionalLight.shadow.camera.bottom = -25
    scene.add(directionalLight)
    
    // 🌟 Dodatkowe światło wypełniające dla lepszych cieni
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3)
    fillLight.position.set(-10, 10, -10)
    scene.add(fillLight)
    
    // 🌟 Światło od spodu dla lepszego oświetlenia
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2)
    bottomLight.position.set(0, -10, 0)
    scene.add(bottomLight)
    
    // Siatka pomocnicza
    const gridHelper = new THREE.GridHelper(50, 50)
    scene.add(gridHelper)
    
    // Raycaster
    raycasterRef.current = new THREE.Raycaster()
    mouseRef.current = new THREE.Vector2()
    
    // Event listeners
    renderer.domElement.addEventListener('click', handleMouseClick)
    window.addEventListener('resize', handleResize)
    
    // Render loop
    animate()
  }
  
  // Render loop
  const animate = () => {
    requestAnimationFrame(animate)
    
    if (controlsRef.current) {
      controlsRef.current.update()
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }
  
  // Obsługa resize
  const handleResize = () => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
    
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(width, height)
  }
  
  // Obsługa kliknięć
  const handleMouseClick = (event: MouseEvent) => {
    if (!raycasterRef.current || !mouseRef.current || !cameraRef.current || !sceneRef.current) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true)
    
    // 🎯 DEBUG: Sprawdź strukturę sceny
    console.log(`🎯 Struktura sceny (${sceneRef.current.children.length} elementów):`)
    sceneRef.current.children.forEach((child, index) => {
      console.log(`  ${index}: ${child.name} (${child.type}) - userData:`, child.userData)
      console.log(`    - fenceElementId:`, child.userData.fenceElementId)
      console.log(`    - userData keys:`, Object.keys(child.userData))
      if (child.children && child.children.length > 0) {
        child.children.forEach((grandchild, gIndex) => {
          console.log(`    ${gIndex}: ${grandchild.name} (${grandchild.type}) - userData:`, grandchild.userData)
          console.log(`      - fenceElementId:`, grandchild.userData.fenceElementId)
          console.log(`      - userData keys:`, Object.keys(grandchild.userData))
        })
      }
    })
    
    console.log(`🎯 Kliknięcie myszy:`, {
      mousePosition: { x: mouseRef.current.x, y: mouseRef.current.y },
      sceneChildren: sceneRef.current.children.length,
      intersects: intersects.length,
      clickedObjects: intersects.map(intersect => ({
        object: intersect.object.name,
        userData: intersect.object.userData,
        parent: intersect.object.parent?.name,
        type: intersect.object.type,
        hasGeometry: !!(intersect.object as any).geometry,
        hasMaterial: !!(intersect.object as any).material,
        position: intersect.object.position,
        visible: intersect.object.visible
      }))
    })
    
    // 🎯 DEBUG: Sprawdź userData klikniętych obiektów
    console.log(`🎯 Szczegóły klikniętych obiektów:`)
    intersects.forEach((intersect, index) => {
      const obj = intersect.object
      console.log(`  ${index}: ${obj.name} (${obj.type})`)
      console.log(`    - userData:`, obj.userData)
      console.log(`    - fenceElementId:`, obj.userData.fenceElementId)
      console.log(`    - userData keys:`, Object.keys(obj.userData))
      console.log(`    - parent:`, obj.parent?.name)
      console.log(`    - parent userData:`, obj.parent?.userData)
      if (obj.parent?.userData) {
        console.log(`    - parent fenceElementId:`, obj.parent.userData.fenceElementId)
      }
    })
    
    if (intersects.length > 0) {
      // 🎯 NAPRAWIONA LOGIKA: Znajdź pierwszy obiekt który ma fenceElementId
      let fenceElementId: string | null = null
      let foundInParent = false
      
      // 🎯 SPRAWDŹ WSZYSTKIE PRZECIĘCIA - znajdź element ogrodzenia
      for (let i = 0; i < intersects.length; i++) {
        const clickedObject = intersects[i].object
        
                // 🎯 IGNORUJ ELEMENTY POMOCNICZE (siatka, światło, kamera)
        if (clickedObject.type === 'GridHelper' ||
            clickedObject.type === 'AmbientLight' ||
            clickedObject.type === 'DirectionalLight') {
          console.log(`🚫 Ignoruję element pomocniczy: ${clickedObject.type} ${clickedObject.name}`)
          continue
        }
        
        console.log(`🎯 Sprawdzam obiekt: ${clickedObject.name} (${clickedObject.type})`)
        
        // 🎯 SPRAWDŹ NAJPIERW KLIKNIĘTY OBIEKT
        if (clickedObject.userData.fenceElementId) {
          fenceElementId = clickedObject.userData.fenceElementId
          console.log(`🎯 Znaleziono fenceElementId w klikniętym obiekcie:`, fenceElementId)
          break
        }
        
        // 🎯 SPRAWDŹ RODZICA (dla Mesh, LineSegments, itp.)
        if (clickedObject.parent && clickedObject.parent.userData.fenceElementId) {
          fenceElementId = clickedObject.parent.userData.fenceElementId
          foundInParent = true
          console.log(`🎯 Znaleziono fenceElementId w rodzicu ${clickedObject.parent.name}:`, fenceElementId)
          break
        }
        
        // 🎯 SPRAWDŹ DALEJ W HIERARCHII (szukaj w górę)
        let searchObject: THREE.Object3D | null = clickedObject.parent
        let depth = 0
        while (searchObject && !fenceElementId && depth < 15) {
          console.log(`🔍 Szukam w obiekcie ${searchObject.name} (głębokość ${depth}):`, searchObject.userData)
          if (searchObject.userData.fenceElementId) {
            fenceElementId = searchObject.userData.fenceElementId
            foundInParent = true
            console.log(`🎯 Znaleziono fenceElementId w hierarchii ${searchObject.name} (głębokość ${depth}):`, fenceElementId)
            break
          }
          searchObject = searchObject.parent
          depth++
        }
        
        if (fenceElementId) break // Znaleziono - przerwij pętlę
      }
      
      console.log(`🎯 Znaleziony fenceElementId:`, fenceElementId, foundInParent ? '(w rodzicu)' : '(w obiekcie)')
      
      if (fenceElementId) {
        console.log(`🎯 Wywołuję onElementSelect z:`, fenceElementId)
        onElementSelect(fenceElementId)
      } else {
        console.log(`❌ Nie znaleziono fenceElementId - kliknąłeś na element pomocniczy (siatka, światło) lub poza ogrodzeniem`)
        console.log(`💡 Kliknij bezpośrednio na słupek (blok) żeby go edytować`)
      }
    } else {
      console.log(`❌ Brak przecięć z obiektami w scenie`)
    }
  }
  
  // 🎨 Zastosowanie tekstur do modelu 3D
  const applyTexturesToModel = async (model: THREE.Object3D, textures: any) => {
    console.log('🔍 DEBUG: applyTexturesToModel - model:', model)
    console.log('🔍 DEBUG: applyTexturesToModel - textures:', textures)
    console.log('🔍 DEBUG: Dostępne tekstury metalu:', textures.metal)
    console.log('🔍 DEBUG: Dostępne tekstury drewna:', textures.wood)
    
    if (!textures) {
      console.log('❌ DEBUG: Brak tekstur do zastosowania')
      return
    }
    
    let appliedCount = 0
    model.traverse((child: any) => {
      console.log(`🔍 DEBUG: Przetwarzam obiekt: ${child.name} (${child.type}) - isMesh: ${child.isMesh}, hasMaterial: ${!!child.material}`)
      
      if (child.isMesh && child.material) {
        // 🎯 Sprawdź nazwę obiektu, żeby określić typ materiału
        const objectName = child.name.toLowerCase()
        console.log(`🔍 DEBUG: Sprawdzam obiekt: ${child.name} (${objectName})`)
          
                    // 🎯 Dla modelu DAE - group_0 to podstawowe bloki, group_1 to dekoracja
          if (objectName.includes('group_0') || objectName.includes('base') || objectName.includes('post') || objectName.includes('fence')) {
            // 🌳 Materiał drewniany z teksturami
                           if (textures.wood && textures.wood.diffuse) {
                 const materialProps: any = {
                   map: textures.wood.diffuse,
                   roughness: 0.8,
                   metalness: 0.1,
                   envMapIntensity: 1.0,
                   // 🎯 Ultra realistyczne ustawienia PBR
                   transparent: false,
                   side: THREE.DoubleSide, // Renderuj obie strony powierzchni dla lepszych krawędzi
                   flatShading: false, // Naturalne cieniowanie bez agresywnych krawędzi
                   wireframe: false,
                   // Przywracam oryginalne ustawienia
                 }
                 
                 // 🎯 Dodaj wszystkie dostępne mapy tekstur
                 if (textures.wood.normal) {
                   materialProps.normalMap = textures.wood.normal
                   materialProps.normalScale = new THREE.Vector2(1, 1) // Naturalny normal scale bez agresywnych efektów
                 }
                 if (textures.wood.roughness) materialProps.roughnessMap = textures.wood.roughness
                 if (textures.wood.metalness) materialProps.metalnessMap = textures.wood.metalness
                 if (textures.wood.ao) materialProps.aoMap = textures.wood.ao
                 if (textures.wood.height) materialProps.displacementMap = textures.wood.height
                 
                 child.material = new THREE.MeshStandardMaterial(materialProps)
                 console.log(`🎨 Zastosowano ultra realistyczne tekstury drewna do: ${child.name}`)
                 appliedCount++
               } else {
                 console.log(`⚠️ DEBUG: Brak tekstur drewna dla: ${child.name}`)
               }
          } else if (objectName.includes('group_1') || objectName.includes('decoration') || objectName.includes('top')) {
            // 🎨 Materiał dekoracyjny (górna część) - używam tekstur drewna lub metalu
                         if (textures.metal && textures.metal.diffuse) {
               const materialProps: any = {
                 map: textures.metal.diffuse,
                 roughness: 0.3,
                 metalness: 0.9,
                 envMapIntensity: 1.2,
                 // 🎯 Ultra realistyczne ustawienia PBR dla metalu w dekoracji
                 transparent: false,
                 side: THREE.DoubleSide, // Renderuj obie strony powierzchni dla lepszych krawędzi
                 flatShading: false, // Naturalne cieniowanie bez agresywnych krawędzi
                 wireframe: false
               }
               
               // 🎯 Dodaj wszystkie dostępne mapy tekstur
               if (textures.metal.normal) {
                 materialProps.normalMap = textures.metal.normal
                 materialProps.normalScale = new THREE.Vector2(1, 1) // Naturalny normal scale bez agresywnych efektów
               }
               if (textures.metal.roughness) materialProps.roughnessMap = textures.metal.roughness
               if (textures.metal.metalness) materialProps.metalnessMap = textures.metal.metalness
               if (textures.metal.ao) materialProps.aoMap = textures.metal.ao
               if (textures.metal.height) materialProps.displacementMap = textures.metal.height
               
               child.material = new THREE.MeshStandardMaterial(materialProps)
               console.log(`🎨 Zastosowano ultra realistyczne tekstury metalu do: ${child.name}`)
               appliedCount++
             } else if (textures.wood && textures.wood.diffuse) {
               const materialProps: any = {
                 map: textures.wood.diffuse,
                 roughness: 0.6,
                 metalness: 0.2,
                 envMapIntensity: 1.0,
                 // 🎯 Ultra realistyczne ustawienia PBR dla dekoracji
                 transparent: false,
                 side: THREE.DoubleSide, // Renderuj obie strony powierzchni dla lepszych krawędzi
                 flatShading: false, // Naturalne cieniowanie bez agresywnych krawędzi
                 wireframe: false
               }
               
               // 🎯 Dodaj wszystkie dostępne mapy tekstur
               if (textures.wood.normal) {
                 materialProps.normalMap = textures.wood.normal
                 materialProps.normalScale = new THREE.Vector2(1, 1) // Naturalny normal scale bez agresywnych efektów
               }
               if (textures.wood.roughness) materialProps.roughnessMap = textures.wood.roughness
               if (textures.wood.metalness) materialProps.metalnessMap = textures.wood.metalness
               if (textures.wood.ao) materialProps.aoMap = textures.wood.ao
               if (textures.wood.height) materialProps.displacementMap = textures.wood.height
               
               child.material = new THREE.MeshStandardMaterial(materialProps)
               console.log(`🎨 Zastosowano ultra realistyczne tekstury drewna do: ${child.name}`)
               appliedCount++
             } else {
               console.log(`⚠️ DEBUG: Brak tekstur dla dekoracji: ${child.name}`)
             }
                    } else if (objectName.includes('metal') || objectName.includes('gate') || objectName.includes('hinge') || objectName.includes('group_13')) {
            // 🎨 Materiał metalowy z teksturami
            console.log(`🔍 DEBUG: Rozpoznano element metalu: ${child.name} (${objectName})`)
            
            if (textures.metal && textures.metal.diffuse) {
              const materialProps: any = {
                map: textures.metal.diffuse,
                roughness: 0.3,
                metalness: 0.9,
                envMapIntensity: 1.2,
                // 🎯 Ultra realistyczne ustawienia PBR dla metalu
                transparent: false,
                side: THREE.DoubleSide, // Renderuj obie strony powierzchni dla lepszych krawędzi
                flatShading: false, // Naturalne cieniowanie bez agresywnych krawędzi
                wireframe: false
              }
              
              // 🎯 Dodaj wszystkie dostępne mapy tekstur
                             if (textures.metal.normal) {
                 materialProps.normalMap = textures.metal.normal
                 materialProps.normalScale = new THREE.Vector2(2, 2) // Zwiększam normal scale dla lepszych krawędzi
               }
              if (textures.metal.roughness) materialProps.roughnessMap = textures.metal.roughness
              if (textures.metal.metalness) materialProps.metalnessMap = textures.metal.metalness
              if (textures.metal.ao) materialProps.aoMap = textures.metal.ao
              if (textures.metal.height) materialProps.displacementMap = textures.metal.height
              
              child.material = new THREE.MeshStandardMaterial(materialProps)
              console.log(`🎨 Zastosowano ultra realistyczne tekstury metalu do: ${child.name}`)
              console.log(`🔍 DEBUG: Użyto tekstury: ${textures.metal.diffuse}`)
              appliedCount++
            } else {
              console.log(`⚠️ DEBUG: Brak tekstur metalu dla: ${child.name}`)
              console.log(`🔍 DEBUG: Dostępne tekstury metalu:`, textures.metal)
            }
                  } else {
                          // 🎨 Domyślny materiał z teksturą drewna dla wszystkich innych obiektów
              if (textures.wood && textures.wood.diffuse) {
                const materialProps: any = {
                  map: textures.wood.diffuse,
                  roughness: 0.6,
                  metalness: 0.2,
                  envMapIntensity: 1.0,
                  // 🎯 Ultra realistyczne ustawienia PBR
                  transparent: false,
                  side: THREE.DoubleSide, // Renderuj obie strony powierzchni dla lepszych krawędzi
                  flatShading: false, // Naturalne cieniowanie bez agresywnych krawędzi
                  wireframe: false
                }
                
                // 🎯 Dodaj wszystkie dostępne mapy tekstur
                if (textures.wood.normal) {
                  materialProps.normalMap = textures.wood.normal
                  materialProps.normalScale = new THREE.Vector2(2, 2) // Zwiększam normal scale dla lepszych krawędzi
                }
                if (textures.wood.roughness) materialProps.roughnessMap = textures.wood.roughness
                if (textures.wood.metalness) materialProps.metalnessMap = textures.wood.metalness
                if (textures.wood.ao) materialProps.aoMap = textures.wood.ao
                if (textures.wood.height) materialProps.displacementMap = textures.wood.height
                
                child.material = new THREE.MeshStandardMaterial(materialProps)
                console.log(`🎨 Zastosowano ultra realistyczne domyślne tekstury do: ${child.name}`)
                appliedCount++
              } else {
                console.log(`⚠️ DEBUG: Brak tekstur dla: ${child.name} - używam domyślnego materiału`)
              }
          }
      }
    })
    
    console.log('✅ Tekstury zastosowane do całego modelu!')
    console.log('🔍 DEBUG: Zastosowano tekstury do', appliedCount, 'obiektów')
  }

  // 🎨 Automatyczne konwertowanie plików .tif na .jpg dla lepszej kompatybilności
  const convertTiffToJpeg = async (tiffPath: string): Promise<string | null> => {
    try {
      console.log('🔄 DEBUG: Próbuję automatycznie przekonwertować .tif na .jpg:', tiffPath)
      
      // 🎯 Sprawdź czy plik .jpg już istnieje
      const jpegPath = tiffPath.replace('.tif', '.jpg')
      
      // 🎯 Jeśli plik .jpg już istnieje, użyj go
      try {
        const response = await fetch(jpegPath)
        if (response.ok) {
          console.log('✅ DEBUG: Plik .jpg już istnieje, używam go:', jpegPath)
          return jpegPath
        }
      } catch {
        // Plik .jpg nie istnieje, kontynuuj
      }
      
      // 🎯 Spróbuj załadować plik .tif i przekonwertować go
      const response = await fetch(tiffPath)
      if (!response.ok) {
        console.log('❌ DEBUG: Nie można załadować pliku .tif:', tiffPath)
        return null
      }
      
      const blob = await response.blob()
      
      // 🎯 Utwórz canvas do konwersji
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.log('❌ DEBUG: Nie można utworzyć canvas do konwersji')
        return null
      }
      
      // 🎯 Załaduj obraz do canvas
      const img = new Image()
      const objectUrl = URL.createObjectURL(blob)
      
      return new Promise((resolve) => {
        img.onload = () => {
          // 🎯 Ustaw rozmiar canvas
          canvas.width = img.width
          canvas.height = img.height
          
          // 🎯 Narysuj obraz na canvas
          ctx.drawImage(img, 0, 0)
          
          // 🎯 Konwertuj na .jpg
          canvas.toBlob((jpegBlob) => {
            if (jpegBlob) {
              // 🎯 Utwórz URL dla przekonwertowanego pliku
              const jpegUrl = URL.createObjectURL(jpegBlob)
              console.log('✅ DEBUG: Pomyślnie przekonwertowano .tif na .jpg')
              resolve(jpegUrl)
            } else {
              console.log('❌ DEBUG: Błąd konwersji na .jpg')
              resolve(null)
            }
          }, 'image/jpeg', 0.9)
          
          // 🎯 Zwolnij pamięć
          URL.revokeObjectURL(objectUrl)
        }
        
        img.onerror = () => {
          console.log('❌ DEBUG: Błąd ładowania obrazu .tif do canvas')
          URL.revokeObjectURL(objectUrl)
          resolve(null)
        }
        
        img.src = objectUrl
      })
      
    } catch (error) {
      console.log('❌ DEBUG: Błąd konwersji .tif na .jpg:', error)
      return null
    }
  }

  // 🎨 Automatyczne wyszukiwanie i konwertowanie wszystkich plików .tif w folderze
  const autoConvertTiffFiles = async (texturePath: string): Promise<string[]> => {
    try {
      console.log('🔍 DEBUG: Automatycznie wyszukuję pliki .tif w folderze:', texturePath)
      
      // 🎯 Lista typowych nazw plików tekstur
      const commonTextureNames = [
        'material_1', 'material_1_0', 'diffuse', 'albedo', 'base_color',
        'wood', 'metal', 'stone', 'brick', 'concrete',
        'texture', 'main', 'primary', 'secondary'
      ]
      
      const convertedPaths: string[] = []
      
      // 🎯 Spróbuj przekonwertować każdy typowy plik .tif
      for (const name of commonTextureNames) {
        const tiffPath = `${texturePath}/${name}.tif`
        const convertedPath = await convertTiffToJpeg(tiffPath)
        if (convertedPath) {
          convertedPaths.push(convertedPath)
          console.log(`✅ DEBUG: Pomyślnie przekonwertowano: ${name}.tif -> ${name}.jpg`)
        }
      }
      
      console.log(`🎯 DEBUG: Przekonwertowano ${convertedPaths.length} plików .tif`)
      return convertedPaths
      
    } catch (error) {
      console.log('❌ DEBUG: Błąd automatycznego konwertowania plików .tif:', error)
      return []
    }
  }

  // 🎨 Ultra inteligentne wyszukiwanie i automatyczne generowanie wszystkich map tekstur dla mega realistycznego wyglądu
  const findTextureMaps = async (texturePath: string, baseName: string): Promise<{
    diffuse?: THREE.Texture,
    normal?: THREE.Texture,
    roughness?: THREE.Texture,
    metalness?: THREE.Texture,
    ao?: THREE.Texture,
    height?: THREE.Texture
  }> => {
    const maps: any = {}
    const textureLoader = new THREE.TextureLoader()
    
    // 🚀 CACHE: Sprawdź czy tekstury są już załadowane
    const cacheKey = `${texturePath}_${baseName}`
    if (textureCache.current.has(cacheKey)) {
      console.log(`🚀 Używam cache'owanych tekstur dla: ${cacheKey}`)
      return textureCache.current.get(cacheKey)!
    }
    
    console.log(`🔍 DEBUG: Rozpoczynam ultra inteligentne wyszukiwanie map dla: ${baseName}`)
    
    // 🎯 Najpierw spróbuj znaleźć wszystkie pliki w folderze
    const allFiles = [
      'material_1', 'material_1_0', 'diffuse', 'albedo', 'base_color',
      'wood', 'metal', 'stone', 'brick', 'concrete',
      'texture', 'main', 'primary', 'secondary'
    ]
    
    // 🚀 OPTYMALIZACJA: Równoległe ładowanie wszystkich tekstur zamiast sekwencyjnego
    const loadPromises: Promise<{ type: string, texture: THREE.Texture | null, name: string }>[] = []
    
    // 🎯 Diffuse maps - priorytet
    const diffusePriority = ['material_1', 'material_1_0', 'diffuse', 'albedo', 'base_color']
    diffusePriority.forEach(name => {
      loadPromises.push(
        textureLoader.loadAsync(`${texturePath}/${name}.jpg`)
          .then(texture => ({ type: 'diffuse', texture, name: `${name}.jpg` }))
          .catch(() => 
            textureLoader.loadAsync(`${texturePath}/${name}.png`)
              .then(texture => ({ type: 'diffuse', texture, name: `${name}.png` }))
              .catch(() => ({ type: 'diffuse', texture: null, name: `${name}` }))
          )
      )
    })
    
    // 🎯 Normal maps
    const normalNames = ['normal', 'norm', 'n', 'bump', 'height', 'displacement']
    normalNames.forEach(suffix => {
      allFiles.forEach(base => {
        loadPromises.push(
          textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.jpg`)
            .then(texture => ({ type: 'normal', texture, name: `${base}_${suffix}.jpg` }))
            .catch(() => 
              textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.png`)
                .then(texture => ({ type: 'normal', texture, name: `${base}_${suffix}.png` }))
                .catch(() => ({ type: 'normal', texture: null, name: `${base}_${suffix}` }))
            )
          )
      })
    })
    
    // 🎯 Roughness maps
    const roughnessNames = ['roughness', 'rough', 'r', 'gloss', 'smoothness']
    roughnessNames.forEach(suffix => {
      allFiles.forEach(base => {
        loadPromises.push(
          textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.jpg`)
            .then(texture => ({ type: 'roughness', texture, name: `${base}_${suffix}.jpg` }))
            .catch(() => 
              textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.png`)
                .then(texture => ({ type: 'roughness', texture, name: `${base}_${suffix}.png` }))
                .catch(() => ({ type: 'roughness', texture: null, name: `${base}_${suffix}` }))
            )
          )
      })
    })
    
    // 🎯 Metalness maps
    const metalnessNames = ['metalness', 'metallic', 'metal', 'm', 'specular']
    metalnessNames.forEach(suffix => {
      allFiles.forEach(base => {
        loadPromises.push(
          textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.jpg`)
            .then(texture => ({ type: 'metalness', texture, name: `${base}_${suffix}.jpg` }))
            .catch(() => 
              textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.png`)
                .then(texture => ({ type: 'metalness', texture, name: `${base}_${suffix}.png` }))
                .catch(() => ({ type: 'metalness', texture: null, name: `${base}_${suffix}` }))
            )
          )
      })
    })
    
    // 🎯 AO maps
    const aoNames = ['ao', 'occlusion', 'ambient', 'shadow', 'dark']
    aoNames.forEach(suffix => {
      allFiles.forEach(base => {
        loadPromises.push(
          textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.jpg`)
            .then(texture => ({ type: 'ao', texture, name: `${base}_${suffix}.jpg` }))
            .catch(() => 
              textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.png`)
                .then(texture => ({ type: 'ao', texture, name: `${base}_${suffix}.png` }))
                .catch(() => ({ type: 'ao', texture: null, name: `${base}_${suffix}` }))
            )
          )
      })
    })
    
    // 🎯 Height maps
    const heightNames = ['height', 'displacement', 'disp', 'bump', 'depth']
    heightNames.forEach(suffix => {
      allFiles.forEach(base => {
        loadPromises.push(
          textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.jpg`)
            .then(texture => ({ type: 'height', texture, name: `${base}_${suffix}.jpg` }))
            .catch(() => 
              textureLoader.loadAsync(`${texturePath}/${base}_${suffix}.png`)
                .then(texture => ({ type: 'height', texture, name: `${base}_${suffix}.png` }))
                .catch(() => ({ type: 'height', texture: null, name: `${base}_${suffix}` }))
            )
          )
      })
    })
    
    // 🚀 RÓWNOLEGŁE ŁADOWANIE WSZYSTKICH TEKSTUR
    console.log(`🚀 Rozpoczynam równoległe ładowanie ${loadPromises.length} tekstur...`)
    const results = await Promise.allSettled(loadPromises)
    
    // 🎯 Przetwórz wyniki i znajdź pierwsze udane ładowanie dla każdego typu
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.texture) {
        const { type, texture, name } = result.value
        if (!maps[type]) {
          maps[type] = texture
          console.log(`✅ DEBUG: Znaleziono ${type} map: ${name}`)
        }
      }
    })
    
    // 🎯 Zastosuj ultra wysokiej jakości ustawienia dla wszystkich tekstur
    Object.values(maps).forEach(texture => {
      if (texture && texture instanceof THREE.Texture) {
        texture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
        texture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
        texture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
        texture.generateMipmaps = true
        texture.anisotropy = 16 // Ultra wysokiej jakości filtrowanie
        // texture.encoding i texture.flipY zostały usunięte w nowszych wersjach Three.js
      }
    })
    
    // 🌟 AUTOMATYCZNE GENEROWANIE BRAKUJĄCYCH MAP TEKSTUR DLA ULTRA REALISTYCZNEGO WYGLĄDU
    if (maps.diffuse && !maps.normal) {
      console.log('🎨 Automatycznie generuję normal map z diffuse...')
      maps.normal = await generateNormalMap(maps.diffuse)
    }
    
    if (maps.diffuse && !maps.roughness) {
      console.log('🎨 Automatycznie generuję roughness map z diffuse...')
      maps.roughness = await generateRoughnessMap(maps.diffuse)
    }
    
    if (maps.diffuse && !maps.metalness) {
      console.log('🎨 Automatycznie generuję metalness map z diffuse...')
      maps.metalness = await generateMetalnessMap(maps.diffuse)
    }
    
    if (maps.diffuse && !maps.ao) {
      console.log('🎨 Automatycznie generuję AO map z diffuse...')
      maps.ao = await generateAOMap(maps.diffuse)
    }
    
    if (maps.diffuse && !maps.height) {
      console.log('🎨 Automatycznie generuję height map z diffuse...')
      maps.height = await generateHeightMap(maps.diffuse)
    }
    
    console.log(`🎯 DEBUG: Znaleziono i wygenerowano ${Object.keys(maps).length} map tekstur dla ${baseName}:`, Object.keys(maps))
    
    // 🚀 CACHE: Zapisz załadowane tekstury do cache
    textureCache.current.set(cacheKey, maps)
    console.log(`🚀 Zapisano ${Object.keys(maps).length} tekstur do cache: ${cacheKey}`)
    
    return maps
  }
  
  // 🌟 Funkcje automatycznego generowania map tekstur dla ultra realistycznego wyglądu
  const generateNormalMap = async (diffuseTexture: THREE.Texture): Promise<THREE.Texture> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = diffuseTexture.image.width
    canvas.height = diffuseTexture.image.height
    
    // 🎯 Generuj normal map na podstawie jasności diffuse
    ctx.drawImage(diffuseTexture.image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      // 🎯 Normal map: R=128, G=128, B=brightness*255
      data[i] = 128     // R
      data[i + 1] = 128 // G  
      data[i + 2] = Math.floor(brightness * 255) // B
      data[i + 3] = 255 // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    const normalTexture = new THREE.CanvasTexture(canvas)
    normalTexture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    normalTexture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    normalTexture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
    normalTexture.generateMipmaps = true
    normalTexture.anisotropy = 16
    
    console.log('✅ Wygenerowano normal map')
    return normalTexture
  }
  
  const generateRoughnessMap = async (diffuseTexture: THREE.Texture): Promise<THREE.Texture> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = diffuseTexture.image.width
    canvas.height = diffuseTexture.image.height
    
    // 🎯 Generuj roughness map na podstawie kontrastu diffuse
    ctx.drawImage(diffuseTexture.image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      // 🎯 Roughness map: ciemniejsze = bardziej szorstkie
      const roughness = Math.max(0.1, Math.min(0.9, 0.3 + brightness * 0.4))
      const value = Math.floor(roughness * 255)
      data[i] = value     // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    const roughnessTexture = new THREE.CanvasTexture(canvas)
    roughnessTexture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    roughnessTexture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    roughnessTexture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
    roughnessTexture.generateMipmaps = true
    roughnessTexture.anisotropy = 16
    
    console.log('✅ Wygenerowano roughness map')
    return roughnessTexture
  }
  
  const generateMetalnessMap = async (diffuseTexture: THREE.Texture): Promise<THREE.Texture> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = diffuseTexture.image.width
    canvas.height = diffuseTexture.image.height
    
    // 🎯 Generuj metalness map na podstawie koloru diffuse
    ctx.drawImage(diffuseTexture.image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      const brightness = (r + g + b) / 3
      
      // 🎯 Metalness map: ciemniejsze kolory = bardziej metaliczne
      const metalness = Math.max(0.0, Math.min(1.0, 0.1 + (1 - brightness) * 0.8))
      const value = Math.floor(metalness * 255)
      data[i] = value     // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    const metalnessTexture = new THREE.CanvasTexture(canvas)
    metalnessTexture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    metalnessTexture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    metalnessTexture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
    metalnessTexture.generateMipmaps = true
    metalnessTexture.anisotropy = 16
    
    console.log('✅ Wygenerowano metalness map')
    return metalnessTexture
  }
  
  const generateAOMap = async (diffuseTexture: THREE.Texture): Promise<THREE.Texture> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = diffuseTexture.image.width
    canvas.height = diffuseTexture.image.height
    
    // 🎯 Generuj AO map na podstawie jasności diffuse
    ctx.drawImage(diffuseTexture.image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      // 🎯 AO map: ciemniejsze = więcej cieni
      const ao = Math.max(0.2, Math.min(1.0, 0.5 + brightness * 0.3))
      const value = Math.floor(ao * 255)
      data[i] = value     // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    const aoTexture = new THREE.CanvasTexture(canvas)
    aoTexture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    aoTexture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    aoTexture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
    aoTexture.generateMipmaps = true
    aoTexture.anisotropy = 16
    
    console.log('✅ Wygenerowano AO map')
    return aoTexture
  }
  
  const generateHeightMap = async (diffuseTexture: THREE.Texture): Promise<THREE.Texture> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = diffuseTexture.image.width
    canvas.height = diffuseTexture.image.height
    
    // 🎯 Generuj height map na podstawie jasności diffuse
    ctx.drawImage(diffuseTexture.image, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      // 🎯 Height map: jaśniejsze = wyższe
      const height = Math.max(0.0, Math.min(1.0, brightness * 0.5))
      const value = Math.floor(height * 255)
      data[i] = value     // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255   // A
    }
    
    ctx.putImageData(imageData, 0, 0)
    const heightTexture = new THREE.CanvasTexture(canvas)
    heightTexture.wrapS = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    heightTexture.wrapT = THREE.RepeatWrapping // Przywracam oryginalne ustawienie
    heightTexture.repeat.set(2, 2) // Przywracam oryginalne ustawienie
    heightTexture.generateMipmaps = true
    heightTexture.anisotropy = 16
    
    console.log('✅ Wygenerowano height map')
    return heightTexture
  }

  // 🎨 Ładowanie tekstur dla mega realistycznego wyglądu
  const loadTextures = async (fenceData: any) => {
    console.log('🔍 DEBUG: loadTextures - fenceData:', fenceData)
    console.log('🔍 DEBUG: fenceData.texturePath:', fenceData.texturePath)
    console.log('🔍 DEBUG: fenceData.modelPath:', fenceData.modelPath)
    
    if (!fenceData.texturePath) {
      console.log('❌ Brak ścieżki tekstur w fenceData (texturePath)')
      return
    }

    try {
      console.log('🎨 Ładowanie tekstur dla mega realistycznego wyglądu:', fenceData.texturePath)
      console.log('🔍 DEBUG: Pełna ścieżka tekstur:', `${fenceData.texturePath}`)
      
      // 🎯 Automatycznie przekonwertuj wszystkie pliki .tif na .jpg
      console.log('🔄 DEBUG: Rozpoczynam automatyczne konwertowanie plików .tif...')
      const convertedPaths = await autoConvertTiffFiles(fenceData.texturePath)
      console.log('✅ DEBUG: Automatyczne konwertowanie zakończone, przekonwertowane pliki:', convertedPaths)
      
      // 🎯 Główne tekstury ogrodzenia
      const textureLoader = new THREE.TextureLoader()
      
      // 🌳 Ultra realistyczne wyszukiwanie map tekstur
      console.log('🔍 DEBUG: Rozpoczynam ultra realistyczne wyszukiwanie map tekstur...')
      
      // 🎯 Wyszukaj wszystkie mapy dla drewna
      const woodMaps = await findTextureMaps(fenceData.texturePath, 'material_1')
      let woodTexture = woodMaps.diffuse
      
      // 🎯 Jeśli nie ma material_1, spróbuj inne nazwy
      if (!woodTexture) {
        const alternativeMaps = await findTextureMaps(fenceData.texturePath, 'wood')
        woodTexture = alternativeMaps.diffuse
      }
      
      // 🎯 Fallback - spróbuj bezpośrednio pliki .jpg
      if (!woodTexture) {
        const fallbackNames = ['material_1', 'material_1_0', 'diffuse', 'wood', 'base_color']
        for (const name of fallbackNames) {
          try {
            woodTexture = await textureLoader.loadAsync(`${fenceData.texturePath}/${name}.jpg`)
            console.log(`✅ DEBUG: Fallback - załadowano: ${name}.jpg`)
            break
          } catch {
            // Kontynuuj szukanie
          }
        }
      }
      if (woodTexture) {
        woodTexture.wrapS = THREE.RepeatWrapping
        woodTexture.wrapT = THREE.RepeatWrapping
        woodTexture.repeat.set(2, 2)
      }
      
      // 🌳 Normal map dla drewna (realistyczne wypukłości) - opcjonalne
      let woodNormalMap = null
      try {
        woodNormalMap = await textureLoader.loadAsync(`${fenceData.texturePath}/wood_normal.jpg`)
        woodNormalMap.wrapS = THREE.RepeatWrapping
        woodNormalMap.wrapT = THREE.RepeatWrapping
        woodNormalMap.repeat.set(2, 2)
      } catch {
        console.log('⚠️ Normal map dla drewna nie znaleziony - używam domyślnego')
      }
      
      // 🌳 Roughness map dla drewna (chropowatość) - opcjonalne
      let woodRoughnessMap = null
      try {
        woodRoughnessMap = await textureLoader.loadAsync(`${fenceData.texturePath}/wood_roughness.jpg`)
        woodRoughnessMap.wrapS = THREE.RepeatWrapping
        woodRoughnessMap.wrapT = THREE.RepeatWrapping
        woodRoughnessMap.repeat.set(2, 2)
      } catch {
        console.log('⚠️ Roughness map dla drewna nie znaleziony - używam domyślnego')
      }
      
      // 🎨 Tekstura metalu (dla elementów metalowych) - ultra realistyczne wyszukiwanie
      let metalTexture = null
      console.log('🔍 DEBUG: Próbuję załadować teksturę metalu...')
      
      // 🎯 Wyszukaj wszystkie mapy dla metalu
      const metalMaps = await findTextureMaps(fenceData.texturePath, 'Aluminum')
      metalTexture = metalMaps.diffuse
      
      // 🎯 Jeśli nie ma Aluminum, spróbuj inne nazwy
      if (!metalTexture) {
        const alternativeMaps = await findTextureMaps(fenceData.texturePath, 'metal')
        metalTexture = alternativeMaps.diffuse
      }
      
      // 🎯 Fallback - spróbuj bezpośrednio pliki .jpg
      if (!metalTexture) {
        const fallbackNames = ['Aluminum', 'metal', 'steel', 'iron', 'chrome']
        for (const name of fallbackNames) {
          try {
            metalTexture = await textureLoader.loadAsync(`${fenceData.texturePath}/${name}.jpg`)
            console.log(`✅ DEBUG: Fallback - załadowano metal: ${name}.jpg`)
            break
          } catch {
            // Kontynuuj szukanie
          }
        }
      }
      
      if (metalTexture) {
        metalTexture.wrapS = THREE.RepeatWrapping
        metalTexture.wrapT = THREE.RepeatWrapping
        metalTexture.repeat.set(1, 1)
      } else {
        console.log('⚠️ Tekstura metalu nie znaleziona - używam drewna')
        metalTexture = woodTexture
      }
      
      // 🎨 Normal map dla metalu - opcjonalne
      let metalNormalMap = null
      try {
        metalNormalMap = await textureLoader.loadAsync(`${fenceData.texturePath}/metal_normal.jpg`)
        metalNormalMap.wrapS = THREE.RepeatWrapping
        metalNormalMap.wrapT = THREE.RepeatWrapping
        metalNormalMap.repeat.set(1, 1)
      } catch {
        metalNormalMap = woodNormalMap
      }
      
      // 🎨 Roughness map dla metalu - opcjonalne
      let metalRoughnessMap = null
      try {
        metalRoughnessMap = await textureLoader.loadAsync(`${fenceData.texturePath}/metal_roughness.jpg`)
        metalRoughnessMap.wrapS = THREE.RepeatWrapping
        metalRoughnessMap.wrapT = THREE.RepeatWrapping
        metalRoughnessMap.repeat.set(1, 1)
      } catch {
        metalRoughnessMap = woodRoughnessMap
      }
      
      // 🎯 Zapisuj wszystkie mapy tekstur w fenceData dla ultra realistycznego wyglądu
      if (woodTexture || metalTexture) {
        fenceData.textures = {
          wood: {
            diffuse: woodTexture,
            normal: woodMaps.normal || woodNormalMap,
            roughness: woodMaps.roughness || woodRoughnessMap,
            metalness: woodMaps.metalness,
            ao: woodMaps.ao,
            height: woodMaps.height
          },
          metal: {
            diffuse: metalTexture,
            normal: metalMaps.normal || metalNormalMap,
            roughness: metalMaps.roughness || metalRoughnessMap,
            metalness: metalMaps.metalness,
            ao: metalMaps.ao,
            height: metalMaps.height
          }
        }
        
        console.log('✅ Wszystkie mapy tekstur załadowane dla ultra realistycznego wyglądu!')
        console.log('🎨 Dostępne mapy tekstur:')
        console.log('  - Wood maps:', Object.keys(fenceData.textures.wood).filter(key => fenceData.textures.wood[key]))
        console.log('  - Metal maps:', Object.keys(fenceData.textures.metal).filter(key => fenceData.textures.metal[key]))
      } else {
        console.log('❌ Nie załadowano żadnych tekstur - używam domyślnych materiałów')
        fenceData.textures = undefined
      }
      
    } catch (error) {
      console.error('❌ Błąd ładowania tekstur:', error)
      console.log('⚠️ Używam domyślnych materiałów bez tekstur')
    }
  }

  // 🎨 Ładowanie modelu DAE z teksturami
  const loadDAEModel = async (fenceData: any) => {
    if (!fenceData.modelPath) {
      console.log('❌ Brak pliku DAE w fenceData (modelPath)')
      return
    }
    
    try {
      console.log('🔄 Ładowanie modelu DAE:', fenceData.modelPath)
      const loader = new ColladaLoader()
      const collada = await loader.loadAsync(fenceData.modelPath)
      
      fenceData.preparedModel = collada.scene
      fenceData.modelScale = 0.01
      
      // 🎯 ZAPISZ REFERENCJĘ DO MODELU DAE
      daeModelRef.current = collada.scene
      
      // 🎨 Zastosuj tekstury do modelu
      await loadTextures(fenceData)
      applyTexturesToModel(fenceData.preparedModel, fenceData.textures)
      
      console.log('✅ Model DAE załadowany z teksturami:', fenceData.modelPath)
      console.log('📊 Struktura modelu:', fenceData.preparedModel)
      
      // Debug: Pokaż dostępne elementy w modelu
      if (fenceData.preparedModel.children.length > 0) {
        console.log('🔍 Dostępne elementy w modelu DAE:')
        fenceData.preparedModel.children.forEach((child: any, index: number) => {
          console.log(`  ${index}: ${child.name} (${child.type})`)
          
          // Jeśli to grupa, pokaż jej dzieci
          if (child.children && child.children.length > 0) {
            console.log(`    Dzieci ${child.name}:`)
            child.children.forEach((grandchild: any, gIndex: number) => {
              console.log(`      ${gIndex}: ${grandchild.name} (${grandchild.type})`)
            })
          }
        })
      }
    } catch (error) {
      console.error('❌ Błąd ładowania modelu DAE:', error)
    }
  }
  
  // Dodawanie elementu ogrodzenia
  const addFenceElement = async (
    elementId: string,
    elementType: string,
    position: { x: number; z: number },
    fenceData?: any,
    postHeight?: number,
    onElementAdded?: (elementId: string, elementType: string, position: { x: number; y: number; z: number }, dimensions: { width: number; height: number }) => void
  ) => {
    console.log(`🎯 Dodaję element ogrodzenia: ${elementType} z ID: ${elementId} na pozycji:`, position)
    
    // 🎯 NOWE: Pobierz konfigurację ogrodzenia
    const fenceConfig = getFenceConfig(fenceData?.id || 'gładkie_medium')
    if (!fenceConfig) {
      console.error(`❌ Nie można znaleźć konfiguracji dla ogrodzenia: ${fenceData?.id}`)
      return
    }
    
    console.log(`✅ Używam konfiguracji: ${fenceConfig.name}`)
    
    // Sprawdź czy scena jest gotowa
    if (!sceneRef.current) {
      console.log('❌ Scena Three.js nie jest jeszcze gotowa - czekam...')
      // Spróbuj ponownie za chwilę
      setTimeout(() => {
        addFenceElement(elementId, elementType, position, fenceData, postHeight, onElementAdded)
      }, 1000)
      return
    }
    
    // Sprawdź czy model DAE jest załadowany
    if (!fenceData?.preparedModel) {
      console.log('❌ Model DAE nie jest jeszcze załadowany - czekam...')
      // Spróbuj ponownie za chwilę
      setTimeout(() => {
        addFenceElement(elementId, elementType, position, fenceData, postHeight, onElementAdded)
      }, 1000)
      return
    }
    
    // Sprawdź czy tekstury są załadowane
    const textureCheck = await checkPngFiles()
    console.log('🔍 Sprawdzam tekstury przed dodaniem elementu...')
    
    console.log('✅ Scena, model DAE i tekstury są gotowe - dodaję element...')
    
    const preparedModel = fenceData.preparedModel
    const modelScale = fenceData.modelScale || 0.01
    
    // 🎯 NOWE: Użyj konfiguracji zamiast hardkodowanych wartości
    let elementsToAdd: any[] = []
    
    switch (elementType) {
      case 'post':
        // 🎯 UŻYJ KONFIGURACJI: Pobierz grupy i wysokość z konfiguracji
        const postConfig = fenceConfig.elements?.post
        if (!postConfig) {
          console.error(`❌ Brak konfiguracji post dla: ${fenceConfig.name}`)
          return
        }
        
        const defaultHeight = postHeight || postConfig.defaultHeight || 6
        console.log(`🏗️ Tworzę słupek o wysokości ${defaultHeight} bloków (z konfiguracji: ${postConfig.defaultHeight})`)
        
        // Znajdź grupę SketchUp
        const sketchUpGroup = preparedModel.children.find((child: any) => child.name === 'SketchUp')
        
        if (sketchUpGroup && sketchUpGroup.children) {
          // 🎯 UŻYJ KONFIGURACJI: Pobierz grupy z konfiguracji
          const baseBlock = sketchUpGroup.children.find((child: any) => child.name === postConfig.groups[0])
          if (baseBlock) {
            // Dodaj bloki podstawy (pierwsza grupa powielona)
            for (let i = 0; i < defaultHeight - 1; i++) {
              elementsToAdd.push({ element: baseBlock, name: `${postConfig.groups[0]}_copy_${i}`, type: 'base' })
              console.log(`✅ Dodano do słupka: ${postConfig.groups[0]} (blok podstawy ${i + 1})`)
            }
          }
          
          // 🎯 UŻYJ KONFIGURACJI: Pobierz element dekoracyjny z konfiguracji
          if (defaultHeight > 1 && postConfig.groups[1]) {
            const decorGroup = sketchUpGroup.children.find((child: any) => child.name === postConfig.groups[1])
            if (decorGroup) {
              elementsToAdd.push({ element: decorGroup, name: postConfig.groups[1], type: 'decoration' })
              console.log(`✅ Dodano do słupka: ${postConfig.groups[1]} (dekoracja na górze)`)
            }
          }
          
          console.log(`🏗️ Słupek będzie miał ${elementsToAdd.length} bloków (wysokość: ${defaultHeight})`)
        }
        break
        
      case 'section':
        // 🎯 UŻYJ KONFIGURACJI: Pobierz grupy z konfiguracji
        const sectionConfig = fenceConfig.elements?.section
        if (!sectionConfig) {
          console.error(`❌ Brak konfiguracji section dla: ${fenceConfig.name}`)
          return
        }
        
        console.log(`🔗 Tworzę przęsło z grup: ${sectionConfig.groups.join(', ')}`)
        
        const sketchUpGroupSection = preparedModel.children.find((child: any) => child.name === 'SketchUp')
        if (sketchUpGroupSection && sketchUpGroupSection.children) {
          sectionConfig.groups.forEach((groupName: string) => {
            const foundGroup = sketchUpGroupSection.children.find((child: any) => child.name === groupName)
            if (foundGroup) {
              elementsToAdd.push({ element: foundGroup, name: groupName, type: 'section' })
              console.log(`✅ Dodano do przęsła: ${groupName}`)
            }
          })
        }
        break
        
      case 'gate':
        // 🎯 UŻYJ KONFIGURACJI: Pobierz grupy z konfiguracji
        const gateConfig = fenceConfig.elements?.gate
        if (!gateConfig) {
          console.error(`❌ Brak konfiguracji gate dla: ${fenceConfig.name}`)
          return
        }
        
        console.log(`🚪 Tworzę bramę z grup: ${gateConfig.groups.join(', ')}`)
        
        const sketchUpGroupGate = preparedModel.children.find((child: any) => child.name === 'SketchUp')
        if (sketchUpGroupGate && sketchUpGroupGate.children) {
          gateConfig.groups.forEach((groupName: string) => {
            const foundGroup = sketchUpGroupGate.children.find((child: any) => child.name === groupName)
            if (foundGroup) {
              elementsToAdd.push({ element: foundGroup, name: groupName, type: 'gate' })
              console.log(`✅ Dodano do bramy: ${groupName}`)
            }
          })
        }
        break
        
      case 'door':
        // 🎯 UŻYJ KONFIGURACJI: Pobierz grupy z konfiguracji
        const doorConfig = fenceConfig.elements?.door
        if (!doorConfig) {
          console.error(`❌ Brak konfiguracji door dla: ${fenceConfig.name}`)
          return
        }
        
        console.log(`🚪 Tworzę furtkę z grupy: ${doorConfig.groups.join(', ')}`)
        
        const sketchUpGroupDoor = preparedModel.children.find((child: any) => child.name === 'SketchUp')
        if (sketchUpGroupDoor && sketchUpGroupDoor.children) {
          doorConfig.groups.forEach((groupName: string) => {
            const foundGroup = sketchUpGroupDoor.children.find((child: any) => child.name === groupName)
            if (foundGroup) {
              elementsToAdd.push({ element: foundGroup, name: groupName, type: 'door' })
              console.log(`✅ Dodano do furtki: ${groupName}`)
            }
          })
        }
        break
        
      default:
        console.log(`⚠️ Nieznany typ elementu: ${elementType}`)
        return
    }
    
    if (elementsToAdd.length === 0) {
      console.log(`❌ Nie znaleziono elementów dla typu: ${elementType}`)
      return
    }
    
    // POPRAWKA: Oblicz następną pozycję na podstawie już dodanych elementów 3D
    let finalPosition = { x: position.x, z: position.z }
    
    // 🎯 DLA AKTUALIZACJI WYSOKOŚCI: Używaj dokładnie podanej pozycji
    if (elementType === 'section' || fenceData.isHeightUpdate) {
      console.log(`📍 Używam dokładnej pozycji dla ${elementType}: ${JSON.stringify(finalPosition)}`)
    } else {
      // 🎯 UŻYJ GLOBALNEJ LISTY ELEMENTÓW 3D ZAMIAST LOKALNEJ fenceData.addedElements
      const existingElements = Array.from(elements3DRef.current.values())
      
      if (existingElements.length > 0) {
        // Znajdź najdalej wysunięty element w prawo
        const rightmostElement = existingElements.reduce((rightmost: any, element: any) => {
          return element.position.x > rightmost.position.x ? element : rightmost
        })
        
        // Dodaj nowy element na prawo od najdalej wysuniętego
        const spacing = 0.65 // Delikatnie zmniejszony odstęp między elementami (było 0.7, było 0.6, było 0.4, było 1.0)
        finalPosition = { 
          x: rightmostElement.position.x + spacing, 
          z: 0 
        }
        
        console.log(`📏 Odstępy: spacing=${spacing}, od ${rightmostElement.position.x} do ${finalPosition.x}`)
        console.log(`📍 Automatyczna pozycja: ${JSON.stringify(finalPosition)} (zamiast ${JSON.stringify(position)})`)
        console.log(`📍 Najdalej wysunięty element: ${rightmostElement.name} na pozycji ${JSON.stringify(rightmostElement.position)}`)
        
        // 🎯 AUTOMATYCZNE DODAWANIE PRZĘSŁA MIĘDZY SŁUPKAMI
        if (elementType === 'post' && existingElements.some(el => el.name === 'post_group')) {
          console.log('🎯 Wykryto kolejny słupek - automatycznie dodaję przęsło między słupkami')
          
          // Dodaj przęsło na środku między słupkami
          const sectionPosition = {
            x: rightmostElement.position.x + (spacing / 2), // Na środku między słupkami (0.2)
            z: 0
          }
          
          console.log(`📏 Odstępy: spacing=${spacing}, środek=${spacing/2}, pozycja przęsła=${sectionPosition.x}`)
          
          // Automatycznie dodaj przęsło
          setTimeout(() => {
            const sectionId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            console.log('🎯 Automatycznie dodaję przęsło między słupkami:', sectionPosition)
            addFenceElement(sectionId, 'section', sectionPosition, fenceData)
            console.log('✅ Automatycznie dodano przęsło między słupkami')
          }, 200) // Małe opóźnienie żeby słupek został dodany
        }
      } else {
        console.log(`📍 Pierwszy element - używam pozycji domyślnej: ${JSON.stringify(finalPosition)}`)
      }
    }
    
    if (!sceneRef.current) {
      console.log('❌ Scena nie jest dostępna')
      return
    }
    
    // Stwórz grupę dla wszystkich elementów tego typu
    const elementGroup = new THREE.Group()
    elementGroup.name = `${elementType}_group`
    
    // Dodaj wszystkie elementy do grupy (nie do sceny osobno)
    elementsToAdd.forEach((item, index) => {
      const clonedElement = item.element.clone()
      
      // Wszystkie elementy w tej samej pozycji X, ale z małym offsetem Y żeby się nie nakładały
      // Zaczynam od y: 0 żeby pierwszy blok był na ziemi
      let offsetY
      if (item.type === 'decoration') {
        // Element dekoracyjny ma mniejszy odstęp żeby przylegał do bloków
        offsetY = index * 0.1 + 0.01 // Dodaję 0.01 żeby był tuż nad ostatnim blokiem
      } else if (elementType === 'section' && item.name === 'group_13') {
        // 🎯 DLA PRZĘSŁA: group_13 (metal) powinien być na wysokości 0.09
        offsetY = 0.09 // Metal na wysokości 0.09
        console.log(`🔗 group_13 (metal) pozycjonowany na y = ${offsetY}`)
      } else if (elementType === 'section' && item.name === 'group_14') {
        // 🎯 DLA PRZĘSŁA: group_14 (blok podstawy) na wysokości 0.0
        offsetY = 0.0 // Blok podstawy na ziemi
        console.log(`🔗 group_14 (blok podstawy) pozycjonowany na y = ${offsetY}`)
      } else if (elementType === 'section' && item.name === 'group_15') {
        // 🎯 DLA PRZĘSŁA: group_15 (element dekoracyjny) na wysokości 0.1
        offsetY = 0.1 // Element dekoracyjny na wysokości 0.1
        console.log(`🔗 group_15 (element dekoracyjny) pozycjonowany na y = ${offsetY}`)
      } else if (elementType === 'section' && item.name === 'group_16') {
        // 🎯 DLA PRZĘSŁA: group_16 (dodatkowy element) na wysokości 0.2
        offsetY = 0.2 // Dodatkowy element na wysokości 0.2
        console.log(`🔗 group_16 (dodatkowy element) pozycjonowany na y = ${offsetY}`)
      } else {
        // Bloki podstawy mają normalny odstęp, zaczynam od 0
        offsetY = index * 0.1
      }
      clonedElement.position.set(0, offsetY, 0)
      
      // 🎯 WYZERUJ ROTACJĘ POSZCZEGÓLNYCH ELEMENTÓW
      // Elementy z DAE mają orientację poziomą - muszę je obrócić żeby stały pionowo
      clonedElement.rotation.set(0, 0, 0)
      
      // 🎯 OBRÓĆ ELEMENTY O 90° WOKÓŁ OSI X ŻEBY "STAŁY" PIONOWO
      // Model DAE ma orientację poziomą, więc obracam o 90° wokół osi X
      clonedElement.rotation.x = Math.PI / 2 // 90 stopni = π/2 radiany
      
      // 🎯 DODATKOWO: OBRÓĆ ELEMENTY O 180° WOKÓŁ OSI Y ŻEBY BYŁY PRAWIŁOWO SKIEROWANE
      // Bloki były odwrócone do góry nogami, więc obracam je o 180° wokół osi Y
      clonedElement.rotation.y = Math.PI // 180 stopni = π radiany
      
      console.log(`🔄 Obrócono element ${item.name} o 90° wokół osi X + 180° wokół osi Y - teraz stoi pionowo i jest prawidłowo skierowany`)
      console.log(`🔍 DEBUG: Element ${item.name} - pozycja:`, clonedElement.position)
      console.log(`🔍 DEBUG: Element ${item.name} - rotacja:`, {
        x: clonedElement.rotation.x.toFixed(3),
        y: clonedElement.rotation.y.toFixed(3),
        z: clonedElement.rotation.z.toFixed(3)
      })
      console.log(`🔍 DEBUG: Element ${item.name} - skala:`, clonedElement.scale)
      
      // Zastosuj skalowanie
      clonedElement.scale.setScalar(modelScale)
      
      // 🎯 DODAJ ID ELEMENTU DO KAŻDEJ CZĘŚCI SŁUPKA (dla raycastingu)
      clonedElement.userData.fenceElementId = elementId
      console.log(`🎯 Dodano fenceElementId do części ${item.name}: ${elementId}`)
      
      // 🔍 DEBUG: Po skalowaniu - Element ${item.name}
      console.log(`🔍 DEBUG: Po skalowaniu - Element ${item.name} - pozycja:`, clonedElement.position)
      console.log(`🔍 DEBUG: Po skalowaniu - Element ${item.name} - rotacja:`, {
        x: clonedElement.rotation.x.toFixed(3),
        y: clonedElement.rotation.y.toFixed(3),
        z: clonedElement.rotation.z.toFixed(3)
      })
      console.log(`🔍 DEBUG: Po skalowaniu - Element ${item.name} - skala:`, clonedElement.scale)
      
      // Dodaj do grupy (nie do sceny)
      elementGroup.add(clonedElement)
      
      console.log(`✅ Element ${item.name} (${item.type}) dodany do grupy na pozycji:`, {
        x: 0,
        y: offsetY,
        z: 0,
        scale: modelScale,
        rotation: {
          x: clonedElement.rotation.x.toFixed(3),
          y: clonedElement.rotation.y.toFixed(3),
          z: clonedElement.rotation.z.toFixed(3)
        },
        fenceElementId: clonedElement.userData.fenceElementId
      })
      
      // 🔍 DEBUG: Po dodaniu do grupy - Element ${item.name}
      console.log(`🔍 DEBUG: Po dodaniu do grupy - Element ${item.name} - pozycja w grupie:`, clonedElement.position)
      console.log(`🔍 DEBUG: Po dodaniu do grupy - Element ${item.name} - rotacja w grupie:`, {
        x: clonedElement.rotation.x.toFixed(3),
        y: clonedElement.rotation.y.toFixed(3),
        z: clonedElement.rotation.z.toFixed(3)
      })
      console.log(`🔍 DEBUG: Po dodaniu do grupy - Element ${item.name} - skala w grupie:`, clonedElement.scale)
    })
    
    // 🎯 USTAW POZYCJĘ GRUPY
    elementGroup.position.set(finalPosition.x, 0, finalPosition.z)
    
    // 🎯 OBRÓĆ ELEMENTY O 90° WOKÓŁ OSI Y (słupki i przęsła)
    // Cały element (wszystkie jego części) będzie obrócony o 90°
    if (elementType === 'post' || elementType === 'section') {
      elementGroup.rotation.set(0, Math.PI / 2, 0) // 90° wokół osi Y
      
      // 🎯 ZAPISZ INFORMACJĘ O ROTACJI GRUPY O 90°
      elementGroup.userData.groupRotationY = Math.PI / 2 // 90° rotacja grupy
      
      console.log(`🎯 Obrócono ${elementType} o 90° wokół osi Y`)
      console.log(`🔍 DEBUG: ${elementType} - rotacja grupy po obróceniu:`, {
        x: elementGroup.rotation.x.toFixed(3),
        y: elementGroup.rotation.y.toFixed(3),
        z: elementGroup.rotation.z.toFixed(3)
      })
    }
    
    // 🎯 ZAPISZ PODSTAWOWĄ ROTACJĘ W userData
    elementGroup.userData.baseRotation = 0 // 0° wokół osi Y (grupa nie obracana)
    elementGroup.userData.baseRotationX = Math.PI / 2 // 90° wokół osi X (elementy pionowo)
    
    // 🔍 DEBUG: Po ustawieniu pozycji grupy
    console.log(`🔍 DEBUG: Po ustawieniu pozycji grupy - Pozycja grupy:`, elementGroup.position)
    console.log(`🔍 DEBUG: Po ustawieniu pozycji grupy - Rotacja grupy:`, {
      x: elementGroup.rotation.x.toFixed(3),
      y: elementGroup.rotation.y.toFixed(3),
      z: elementGroup.rotation.z.toFixed(3)
    })
    console.log(`🔍 DEBUG: Po ustawieniu pozycji grupy - Skala grupy:`, elementGroup.scale)
    
    // 🎯 DODATKOWO: ZAPISZ INFORMACJĘ ŻE TO NOWY ELEMENT (dla resetowania rotacji)
    elementGroup.userData.isNewElement = true
    
    // 🎯 SPRAWDŹ CZY ROTACJA ZOSTAŁA ZASTOSOWANA
    console.log(`🔄 Rotacja grupy po ustawieniu:`, {
      x: elementGroup.rotation.x.toFixed(3),
      y: elementGroup.rotation.y.toFixed(3),
      z: elementGroup.rotation.z.toFixed(3)
    })
    
    // Sprawdź rotację pierwszego elementu w grupie
    if (elementGroup.children.length > 0) {
      const firstChild = elementGroup.children[0]
      console.log(`🔄 Rotacja pierwszego elementu:`, {
        x: firstChild.rotation.x.toFixed(3),
        y: firstChild.rotation.y.toFixed(3),
        z: firstChild.rotation.z.toFixed(3)
      })
    }
    
    console.log(`🔄 Każdy element ma rotację o 90° wokół osi X - stoi pionowo zamiast leżeć poziomo`)
    console.log(`📍 Pozycja grupy:`, elementGroup.position)
    console.log(`🔄 Rotacja grupy: Y=${elementGroup.rotation.y.toFixed(3)} rad, X=${elementGroup.rotation.x.toFixed(3)} rad`)
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    console.log(`🔍 DEBUG: ${elementType} - rotacja grupy po obróceniu:`, {
      x: elementGroup.rotation.x.toFixed(3),
      y: elementGroup.rotation.y.toFixed(3),
      z: elementGroup.rotation.z.toFixed(3)
    })
    
    // Dodaj całą grupę do sceny
    sceneRef.current!.add(elementGroup)
    
    // Dodaj do mapy elementów 3D
    elements3DRef.current.set(elementId, elementGroup)
    
    // 🎯 DODAJ ID ELEMENTU DO GRUPY (dla raycastingu)
    elementGroup.userData.fenceElementId = elementId
    console.log(`🎯 Dodano fenceElementId do grupy: ${elementId}`)
    
    // 🎯 AUTOMATYCZNE RESETOWANIE ROTACJI NOWYCH SŁUPKÓW I PRZĘSEŁ DO 0°
    if (elementType === 'post' || elementType === 'section') {
      // Wywołaj updateElementRotation żeby zresetować rotację nowego elementu
      setTimeout(() => {
        updateElementRotation(elementId, 0)
        console.log(`🔄 Automatycznie zresetowano rotację nowego ${elementType} ${elementId} do 0°`)
        console.log(`🔍 DEBUG: ${elementType} - rotacja po resetowaniu:`, {
          x: elementGroup.rotation.x.toFixed(3),
          y: elementGroup.rotation.y.toFixed(3),
          z: elementGroup.rotation.z.toFixed(3)
        })
      }, 100) // Małe opóźnienie żeby upewnić się że element jest w scenie
    }
    
    // 🎯 NOWE PODEJŚCIE: Nie ma PositionGuard do wyłączania
    console.log('🎯 Używam nowego podejścia - nie ma PositionGuard')
    
    // 🎯 SPRAWDŹ CZY GRUPA ZOSTAŁA DODANA DO SCENY
    console.log(`🎯 Grupa ${elementType} dodana do sceny:`, {
      sceneChildren: sceneRef.current!.children.length,
      groupInScene: sceneRef.current!.children.includes(elementGroup),
      groupPosition: elementGroup.position,
      groupRotation: {
        x: elementGroup.rotation.x.toFixed(3),
        y: elementGroup.rotation.y.toFixed(3),
        z: elementGroup.rotation.z.toFixed(3)
      },
      groupChildren: elementGroup.children.length,
      fenceElementId: elementGroup.userData.fenceElementId
    })
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // 🔍 DEBUG: Szczegółowe informacje o każdym elemencie w grupie po dodaniu do sceny
    console.log(`🔍 DEBUG: Szczegóły każdego elementu w grupie po dodaniu do sceny:`)
    elementGroup.children.forEach((child, index) => {
      console.log(`  - Element ${index}: ${child.name}`)
      console.log(`    - Typ: ${child.type}`)
      console.log(`    - Pozycja w grupie:`, child.position)
      console.log(`    - Rotacja w grupie:`, {
        x: child.rotation.x.toFixed(3),
        y: child.rotation.y.toFixed(3),
        z: child.rotation.z.toFixed(3)
      })
      console.log(`    - Skala w grupie:`, child.scale)
      console.log(`    - userData:`, child.userData)
      console.log(`    - fenceElementId:`, child.userData.fenceElementId)
      console.log(`    - userData keys:`, Object.keys(child.userData))
    })
    
    // 🎯 DEBUG: Sprawdź userData grupy
    console.log(`🎯 userData grupy ${elementType}_group:`)
    console.log(`  - fenceElementId:`, elementGroup.userData.fenceElementId)
    console.log(`  - baseRotation:`, elementGroup.userData.baseRotation)
    console.log(`  - isNewElement:`, elementGroup.userData.isNewElement)
    console.log(`  - userData keys:`, Object.keys(elementGroup.userData))
    
    // 🎯 ELEMENT JUŻ JEST W GLOBALNEJ LIŚCIE elements3DRef.current
    console.log(`📊 Łącznie dodanych elementów: ${elements3DRef.current.size}`)
    console.log(`🎯 Dodano grupę ${elementType} z ${elementsToAdd.length} częściami`)
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // 🎯 SPRAWDŹ CZY SCENA MA ELEMENTY
    console.log(`🎯 Scena 3D zawiera teraz:`, {
      totalChildren: sceneRef.current!.children.length,
      fenceElements: elements3DRef.current.size,
      sceneChildren: sceneRef.current!.children.map(child => ({
        name: child.name,
        type: child.type,
        position: child.position,
        visible: child.visible
      }))
    })
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // Wywołaj callback żeby dodać element do kontekstu React (Canvas2D)
    if (onElementAdded) {
      // 🎯 UŻYJ PROSTYCH WYMIARÓW DOMYŚLNYCH ZAMIAST calculateElementDimensions
      const dimensions = { width: 0.8, height: 2.0 } // Domyślne wymiary
      onElementAdded(elementId, elementType, { x: finalPosition.x, y: 0, z: finalPosition.z }, dimensions)
    }
    
    // 🎯 KAMERA POZOSTAJE W POZYCJI USTAWIONEJ W initScene
    console.log('🎯 === ELEMENT DODANY - SPRAWDZAM POZYCJĘ KAMERY ===')
    console.log('🎯 Element dodany - kamera pozostaje w pozycji ustawionej w initScene')
    console.log('📍 Pozycja dodanego elementu:', finalPosition)
    console.log('🎯 Kamera powinna być na pozycji (0, 10, 20) i patrzeć na (0, 0, 0)')
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // 🎯 NOWE PODEJŚCIE: Kamera pozostaje w pozycji użytkownika
    console.log('🎯 Kamera pozostaje w pozycji użytkownika - nie ma PositionGuard')
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // 🎯 AKTUALIZUJ TARGET ORBITCONTROLS ŻEBY PODĄŻAŁ ZA PIERWSZYM SŁUPKIEM
    if (controlsRef.current) {
      // 🎯 UŻYJ GLOBALNEJ LISTY ELEMENTÓW 3D
      const existingElements = Array.from(elements3DRef.current.values())
      
      if (existingElements.length > 0) {
        // Znajdź pierwszy słupek
        const firstPost = existingElements.find((element: any) => element.name === 'post_group')
        if (firstPost) {
          const targetPosition = {
            x: firstPost.position.x,
            y: 0,
            z: firstPost.position.z
          }
          
          console.log('🎯 Aktualizuję target OrbitControls na pierwszy słupek:', targetPosition)
          controlsRef.current.target.set(targetPosition.x, targetPosition.y, targetPosition.z)
          controlsRef.current.update()
          
          console.log('🎯 Target OrbitControls zaktualizowany na:', controlsRef.current.target)
          console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
        }
      }
    }
    
    // 🎯 DODATKOWE DEBUGOWANIE: Sprawdź rzeczywistą pozycję kamery
    if (cameraRef.current) {
      console.log('🎯 RZECZYWISTA pozycja kamery po dodaniu elementu:', {
        cameraPosition: { 
          x: cameraRef.current.position.x, 
          y: cameraRef.current.position.y, 
          z: cameraRef.current.position.z 
        },
        expectedPosition: { x: 0, y: 10, z: 20 }
      })
      console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    } else {
      console.log('❌ Kamera nie jest dostępna w addFenceElement')
    }
    
    if (controlsRef.current) {
      console.log('🎯 RZECZYWISTY target OrbitControls po dodaniu elementu:', {
        controlsTarget: { 
          x: controlsRef.current.target.x, 
          y: controlsRef.current.target.y, 
          z: controlsRef.current.target.z 
        }
      })
      console.log('🎯 Każda grupa (blok) w słupku gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!')
    } else {
      console.log('❌ OrbitControls nie są dostępne w addFenceElement')
    }
    
    console.log(`✅ Element ${elementType} dodany na pozycji:`, finalPosition)
    console.log(`🎯 Scena zawiera teraz ${sceneRef.current!.children.length} elementów`)
    console.log(`🎯 Każda grupa (blok) w ${elementType} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
  }
  
  // Aktualizacja rotacji elementu
  const updateElementRotation = (elementId: string, newRotation: number) => {
    const elementGroup = elements3DRef.current.get(elementId)
    if (!elementGroup) return
    
    const rotationInRadians = (newRotation * Math.PI) / 180
    const baseRotation = elementGroup.userData.baseRotation || Math.PI / 2
    const baseRotationX = elementGroup.userData.baseRotationX || 0
    
    // 🔍 DEBUG: Przed aktualizacją rotacji
    console.log(`🔍 DEBUG: Przed aktualizacją rotacji elementu ${elementId}:`)
    console.log(`  - Pozycja grupy:`, elementGroup.position)
    console.log(`  - Rotacja grupy:`, {
      x: elementGroup.rotation.x.toFixed(3),
      y: elementGroup.rotation.y.toFixed(3),
      z: elementGroup.rotation.z.toFixed(3)
    })
    console.log(`  - baseRotation: ${baseRotation.toFixed(3)}`)
    console.log(`  - baseRotationX: ${baseRotationX.toFixed(3)}`)
    console.log(`  - nowa rotacja: ${newRotation}° (${rotationInRadians.toFixed(3)} rad)`)
    
    // 🎯 DLA SŁUPKA I PRZĘSŁA: Zastosuj rotację do grupy, ale zachowaj podstawową orientację
    if (elementGroup.name === 'post_group' || elementGroup.name === 'section_group') {
      // Użyj zapisanej podstawowej rotacji z userData
      const baseRotation = elementGroup.userData.baseRotation || Math.PI / 2
      const baseRotationX = elementGroup.userData.baseRotationX || 0
      
      // 🎯 ZACHOWAJ OBECNĄ POZYCJĘ (nie zmieniaj pozycji podczas rotacji)
      const currentPosition = elementGroup.position.clone()
      
      // 🎯 NOWA METODA: Resetuj rotację nowych słupków do 0°
      if (elementGroup.userData.isNewElement && newRotation === 0) {
        // To jest nowy słupek z rotacją 0° - zresetuj do podstawowej orientacji + rotacji grupy
        const groupRotationY = elementGroup.userData.groupRotationY || 0 // Rotacja grupy o 90°
        elementGroup.rotation.y = baseRotation + groupRotationY // Podstawowa + rotacja grupy
        elementGroup.rotation.x = 0 // NIE OBRAÇAJ GRUPY WOKÓŁ OSI X - tylko elementy mają rotację
        elementGroup.userData.isNewElement = false // Oznacz jako nie nowy
        console.log(`🔄 Nowy ${elementGroup.name === 'post_group' ? 'słupek' : 'przęsło'} zresetowany do podstawowej orientacji: Y=${(baseRotation + groupRotationY).toFixed(3)} rad (podstawowa ${baseRotation.toFixed(3)} + grupa ${groupRotationY.toFixed(3)}), X=0 rad`)
      } else {
        // 🎯 OBRÓĆ SŁUPEK WOKÓŁ WŁASNEGO ŚRODKA - PROSTA METODA
        // Użyj rotateOnAxis żeby obrócić wokół osi Y w miejscu
        const rotationAxis = new THREE.Vector3(0, 1, 0) // Oś Y
        
        // Resetuj rotację do podstawowej + rotacji grupy (tylko Y - grupa nie obracana wokół X)
        const groupRotationY = elementGroup.userData.groupRotationY || 0 // Rotacja grupy o 90°
        elementGroup.rotation.y = baseRotation + groupRotationY // Podstawowa + rotacja grupy
        elementGroup.rotation.x = 0 // NIE OBRAÇAJ GRUPY WOKÓŁ OSI X - tylko elementy mają rotację
        
        // Dodaj rotację użytkownika wokół własnej osi Y
        elementGroup.rotateOnAxis(rotationAxis, rotationInRadians)
        
        console.log(`🔄 Rotacja ${elementGroup.name === 'post_group' ? 'słupka' : 'przęsła'}: podstawowa Y=${baseRotation.toFixed(3)} + grupa ${groupRotationY.toFixed(3)}, X=0 rad + użytkownika ${rotationInRadians.toFixed(3)} = Y=${elementGroup.rotation.y.toFixed(3)}`)
        console.log(`🎯 Użyto rotateOnAxis dla obrotu w miejscu`)
        console.log(`🎯 Każda grupa (blok) w ${elementGroup.name === 'post_group' ? 'słupku' : 'przęśle'} gladkie medium pozostaje w pionie dzięki zachowaniu rotacji o 90° wokół osi Y`)
      }
      
      console.log(`📍 Pozycja zachowana:`, currentPosition)
    } else {
      // Dla innych elementów po prostu ustaw rotację
      elementGroup.rotation.y = rotationInRadians
      console.log(`🔄 Rotacja elementu: ${rotationInRadians.toFixed(3)}`)
    }
    
    console.log(`✅ Rotacja elementu ${elementId} zaktualizowana na ${newRotation}° (${rotationInRadians.toFixed(3)} rad)`)
    console.log(`🔄 Końcowa rotacja grupy: Y=${elementGroup.rotation.y.toFixed(3)} rad, X=${elementGroup.rotation.x.toFixed(3)} rad`)
    console.log(`🎯 Każda grupa (blok) w ${elementGroup.name === 'post_group' ? 'słupku' : 'przęśle'} gladkie medium stoi pionowo dzięki rotacji o 90° wokół osi Y!`)
    
    // 🔍 DEBUG: Po aktualizacji rotacji
    console.log(`🔍 DEBUG: Po aktualizacji rotacji elementu ${elementId}:`)
    console.log(`  - Typ elementu: ${elementGroup.name}`)
    console.log(`  - Pozycja grupy:`, elementGroup.position)
    console.log(`  - Rotacja grupy:`, {
      x: elementGroup.rotation.x.toFixed(3),
      y: elementGroup.rotation.y.toFixed(3),
      z: elementGroup.rotation.z.toFixed(3)
    })
    console.log(`  - Liczba elementów w grupie: ${elementGroup.children.length}`)
    
    // 🔍 DEBUG: Szczegóły każdego elementu po aktualizacji rotacji
    elementGroup.children.forEach((child, index) => {
      console.log(`  - Element ${index}: ${child.name}`)
      console.log(`    - Pozycja w grupie:`, child.position)
      console.log(`    - Rotacja w grupie:`, {
        x: child.rotation.x.toFixed(3),
        y: child.rotation.y.toFixed(3),
        z: child.rotation.z.toFixed(3)
      })
      console.log(`    - Skala w grupie:`, child.scale)
    })
  }
  
  // 🎯 Aktualizacja wysokości słupka lub przęsła - DODAWANIE/USUWANIE BLOKÓW
  const updatePostHeight = (elementId: string, newHeight: number) => {
    const elementGroup = elements3DRef.current.get(elementId)
    if (!elementGroup || (elementGroup.name !== 'post_group' && elementGroup.name !== 'section_group')) {
      console.log(`❌ Nie znaleziono elementu ${elementId} lub nieprawidłowy typ:`, elementGroup?.name)
      return
    }
    
    console.log(`🏗️ Aktualizuję wysokość elementu ${elementId} z ${elementGroup.children.length} bloków na ${newHeight} bloków`)
    
    // 🎯 DLA SŁUPKA: Dodaj lub usuń bloki
    if (elementGroup.name === 'post_group') {
      const currentBlocks = elementGroup.children.length
      const blocksToAdd = newHeight - currentBlocks
      
      if (blocksToAdd > 0) {
        // 🎯 DODAJ BLOKI
        console.log(`➕ Dodaję ${blocksToAdd} bloków do słupka`)
        addBlocksToPost(elementGroup, blocksToAdd, elementId)
      } else if (blocksToAdd < 0) {
        // 🎯 USUŃ BLOKI
        console.log(`➖ Usuwam ${Math.abs(blocksToAdd)} bloków ze słupka`)
        removeBlocksFromPost(elementGroup, Math.abs(blocksToAdd))
      } else {
        console.log(`✅ Wysokość już jest poprawna: ${newHeight} bloków`)
      }
    } else if (elementGroup.name === 'section_group') {
      // 🎯 DLA PRZĘSŁA: Podobna logika
      console.log(`🔲 Aktualizuję wysokość przęsła - implementacja podobna do słupka`)
    }
  }
  
  // 🎯 FUNKCJA: Dodawanie bloków do słupka - UPROSZCZONA
  const addBlocksToPost = (elementGroup: THREE.Group, blocksToAdd: number, elementId: string) => {
    if (!selectedFence) return
    
    const fenceConfig = getFenceConfig(selectedFence.id || 'gładkie_medium')
    if (!fenceConfig?.elements?.post) {
      console.log(`❌ Brak konfiguracji dla słupka w systemie ${selectedFence.id}`)
      return
    }
    
    console.log(`🏗️ Dodaję ${blocksToAdd} bloków do słupka ${elementId}`)
    
    // 🎯 DODAJ NOWE BLOKI - PROSTO I LOGICZNIE
    for (let i = 0; i < blocksToAdd; i++) {
      const groupName = 'group_0' // Zawsze dodaj podstawowe bloki (group_0)
      
      console.log(`➕ Dodaję blok ${i + 1}: ${groupName}`)
      
      // 🎯 KLONUJ ELEMENT Z MODELU
      const sourceElement = daeModelRef.current?.getObjectByName(groupName)
      if (sourceElement) {
        const clonedElement = sourceElement.clone()
        
        // 🎯 USTAW POZYCJĘ - ZAWSZE OD ZIEMI W GÓRĘ
        const currentBasicBlocks = elementGroup.children.filter(child => child.name === 'group_0').length
        const offsetY = currentBasicBlocks * 0.1 // Pierwszy blok na y=0, drugi na y=0.1, trzeci na y=0.2...
        
        clonedElement.position.set(0, offsetY, 0)
        
        // 🎯 USTAW ROTACJĘ (jak w oryginalnym kodzie)
        clonedElement.rotation.set(Math.PI / 2, Math.PI, 0)
        
        // 🎯 ZASTOSUJ SKALOWANIE - UŻYJ TEJ SAMEJ SKALI CO W GŁÓWNEJ FUNKCJI
        const modelScale = selectedFence?.modelScale || 0.01
        clonedElement.scale.setScalar(modelScale)
        
        // 🎯 DODAJ ID ELEMENTU (dla raycastingu)
        clonedElement.userData.fenceElementId = elementId
        
        // 🎯 ZASTOSUJ TEKSTURY
        if (fenceConfig.elements.post.textures[groupName]) {
          applyTexturesToModel(clonedElement, fenceConfig.elements.post.textures[groupName])
        }
        
        // 🎯 DODAJ DO GRUPY
        elementGroup.add(clonedElement)
        
        console.log(`✅ Dodano blok ${i + 1} (${groupName}) na pozycji Y: ${offsetY}`)
      } else {
        console.log(`❌ Nie znaleziono elementu ${groupName} w modelu DAE`)
      }
    }
    
    // 🎯 PO DODANIU WSZYSTKICH BLOKÓW - PRZEMIEŚĆ BLOK DEKORACYJNY NA GÓRĘ
    const decorationBlock = elementGroup.children.find(child => child.name === 'group_1')
    if (decorationBlock) {
      const basicBlocks = elementGroup.children.filter(child => child.name === 'group_0')
      if (basicBlocks.length > 0) {
        const lastBasicBlock = basicBlocks[basicBlocks.length - 1]
        decorationBlock.position.y = lastBasicBlock.position.y + 0.1
        console.log(`📍 Blok dekoracyjny przemieszczony na pozycję Y: ${decorationBlock.position.y}`)
      }
    }
    
    console.log(`🏗️ Słupka ma teraz ${elementGroup.children.length} bloków`)
  }
  
  // 🎯 FUNKCJA: Usuwanie bloków ze słupka - UPROSZCZONA
  const removeBlocksFromPost = (elementGroup: THREE.Group, blocksToRemove: number) => {
    console.log(`➖ Usuwam ${blocksToRemove} bloków ze słupka`)
    
    // 🎯 USUŃ TYLKO PODSTAWOWE BLOKI (group_0), ZACHOWAJ DEKORACYJNY (group_1)
    let blocksRemoved = 0
    const blocksToRemoveArray = [...elementGroup.children]
    
    // Sortuj bloki od najniższego do najwyższego (od ziemi)
    blocksToRemoveArray.sort((a, b) => a.position.y - b.position.y)
    
    for (const block of blocksToRemoveArray) {
      if (blocksRemoved >= blocksToRemove) break
      
      // Usuń tylko podstawowe bloki (group_0), nie dekoracyjne (group_1)
      if (block.name === 'group_0') {
        elementGroup.remove(block)
        blocksRemoved++
        console.log(`➖ Usunięto podstawowy blok ${block.name} z pozycji Y: ${block.position.y}`)
      }
    }
    
    // 🎯 PRZEMIEŚĆ POZOSTAŁE BLOKI, ŻEBY BYŁY CIĄGLE
    const remainingBlocks = [...elementGroup.children]
    
    // Najpierw ustaw pozycje podstawowych bloków (group_0) od ziemi w górę
    const basicBlocks = remainingBlocks.filter(block => block.name === 'group_0')
    basicBlocks.sort((a, b) => a.position.y - b.position.y)
    
    basicBlocks.forEach((block, index) => {
      block.position.y = index * 0.1
      console.log(`📍 Podstawowy blok ${index + 1} na pozycji Y: ${block.position.y}`)
    })
    
    // 🎯 ZAWSZE USTAW BLOK DEKORACYJNY (group_1) NAD OSTATNIM PODSTAWOWYM BLOKIEM
    const decorationBlock = remainingBlocks.find(block => block.name === 'group_1')
    if (decorationBlock) {
      if (basicBlocks.length > 0) {
        // Jeśli są podstawowe bloki, umieść dekoracyjny nad ostatnim
        const lastBasicBlock = basicBlocks[basicBlocks.length - 1]
        decorationBlock.position.y = lastBasicBlock.position.y + 0.1
        console.log(`📍 Blok dekoracyjny ${decorationBlock.name} nad ostatnim podstawowym blokiem na pozycji Y: ${decorationBlock.position.y}`)
      } else {
        // Jeśli nie ma podstawowych bloków, umieść dekoracyjny na ziemi
        decorationBlock.position.y = 0
        console.log(`📍 Blok dekoracyjny ${decorationBlock.name} na ziemi (Y: 0) - brak podstawowych bloków`)
      }
    }
    
    console.log(`🏗️ Słupka ma teraz ${elementGroup.children.length} bloków (usunięto ${blocksRemoved})`)
  }
  
  // Reset kamery
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 4, 6) // Bardzo blisko i nisko (było 0, 6, 8)
      controlsRef.current.target.set(0, 0, 0)
      controlsRef.current.update()
    }
  }
  
  // Zoom do elementów
  const zoomToFit = () => {
    if (!cameraRef.current || !controlsRef.current || !sceneRef.current) return
    
    const box = new THREE.Box3().setFromObject(sceneRef.current)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = cameraRef.current.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
    
    cameraZ *= 1.5 // Dodaj margines
    
    cameraRef.current.position.set(center.x, center.y + cameraZ * 0.5, center.z + cameraZ)
    controlsRef.current.target.copy(center)
    controlsRef.current.update()
  }
  
  // Inicjalizacja przy montowaniu komponentu
  useEffect(() => {
    initScene()
    
    return () => {
      // Cleanup
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Ładowanie modelu DAE gdy zmienia się fenceSystem
  useEffect(() => {
    if (selectedFence?.modelPath) {
      // 🎯 RESETUJ SCENĘ PRZED ZAŁADOWANIEM NOWEGO MODELU
      if (sceneRef.current) {
        // Usuń wszystkie elementy ogrodzenia
        const elementsToRemove: THREE.Object3D[] = []
        sceneRef.current.children.forEach(child => {
          if (child.userData.fenceElementId) {
            elementsToRemove.push(child)
          }
        })
        
        elementsToRemove.forEach(element => {
          sceneRef.current?.remove(element)
        })
        
        elements3DRef.current.clear()
        console.log('🔄 Scena 3D zresetowana - zmieniono system ogrodzenia')
      }
      
      loadDAEModel(selectedFence)
    }
  }, [selectedFence])
  
  // Eksport funkcji do window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).addFenceElement = addFenceElement
      ;(window as any).updateElementRotation = updateElementRotation
      ;(window as any).updatePostHeight = updatePostHeight
      ;(window as any).getNextElementPosition = (fenceData: any) => {
        if (!fenceData.addedElements || fenceData.addedElements.length === 0) {
          return { x: 0, y: 0, z: 0 }
        }
        
        const rightmostElement = fenceData.addedElements.reduce((rightmost: any, item: any) => {
          return item.position.x > rightmost.position.x ? item : rightmost
        })
        
        return { 
          x: rightmostElement.position.x + 1.0, // Odstęp 1.0
          y: 0, 
          z: 0 
        }
      }
    }
  }, [])
  
  // Reset sceny
  useEffect(() => {
    if (resetCounter > 0 && sceneRef.current) {
      // Usuń wszystkie elementy ogrodzenia
      const elementsToRemove: THREE.Object3D[] = []
      sceneRef.current.children.forEach(child => {
        if (child.userData.fenceElementId) {
          elementsToRemove.push(child)
        }
      })
      
      elementsToRemove.forEach(element => {
        sceneRef.current?.remove(element)
      })
      
      elements3DRef.current.clear()
      
      // 🎯 ELEMENTY SĄ RESETOWANE W elements3DRef.current.clear() (wyżej)
      
      console.log('🔄 Scena 3D zresetowana - użytkownik kliknął reset')
    }
  }, [resetCounter]) // 🎯 UŻYWAM resetCounter - scena będzie resetowana tylko gdy użytkownik kliknie reset
  
  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggleViewMode'))
          }}
          className="px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors flex items-center space-x-2"
          title={`Przełącz na ${viewMode === '3D' ? '2D' : '3D'}`}
        >
          <span className="text-lg">{viewMode === '3D' ? '📐' : '🎨'}</span>
          <span className="text-sm font-medium text-gray-700">
            {viewMode === '3D' ? '2D' : '3D'}
          </span>
        </button>
        
        <button
          onClick={resetCamera}
          className="p-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm hover:bg-white transition-colors"
          title="Resetuj kamerę"
        >
          🎯
        </button>
        
        <button
          onClick={zoomToFit}
          className="p-2 bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-lg shadow-sm hover:bg-blue-100 transition-colors"
          title="Przybliż kamerę do elementów"
        >
          🔍
        </button>
      </div>
    </div>
  )
}

export default ThreeJSCanvas3D