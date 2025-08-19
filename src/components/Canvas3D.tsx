import React, { useRef, useEffect, useState } from 'react'
import { FenceElement, FenceSystem, HouseStyle } from '../contexts/FenceContext'

interface OBJModel {
  vertices: number[]
  normals: number[]
  texCoords: number[]
  indices: number[]
}

interface Canvas3DProps {
  elements: FenceElement[]
  selectedElementId: string | null
  onElementSelect: (id: string | null) => void
  fenceSystem: FenceSystem | null
  houseStyle: HouseStyle | null
  onReset?: number
}

const Canvas3D: React.FC<Canvas3DProps> = ({
  elements,
  selectedElementId,
  onElementSelect,
  fenceSystem,
  houseStyle,
  onReset
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [camera, setCamera] = useState({ x: 0, y: 30, z: 50, rotX: -25, rotY: 0 })
  
  // Mapowanie elementów do obiektów WebGL
  const elementObjectsRef = useRef<Map<string, any>>(new Map())
  
  // Załadowane modele OBJ
  const [loadedModels, setLoadedModels] = useState<Map<string, OBJModel>>(new Map())
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set())

  // Funkcja do ładowania pliku OBJ
  const loadOBJModel = async (url: string): Promise<OBJModel> => {
    try {
      console.log('🔄 Ładowanie modelu OBJ:', url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()
      
      const vertices: number[] = []
      const normals: number[] = []
      const texCoords: number[] = []
      const indices: number[] = []
      
      const lines = text.split('\n')
      let vertexCount = 0
      let faceCount = 0
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length === 0) continue
        
        switch (parts[0]) {
          case 'v': // vertex
            vertices.push(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            )
            vertexCount++
            break
          case 'vn': // normal
            normals.push(
              parseFloat(parts[1]),
              parseFloat(parts[2]),
              parseFloat(parts[3])
            )
            break
          case 'vt': // texture coordinate
            texCoords.push(
              parseFloat(parts[1]),
              parseFloat(parts[2])
            )
            break
          case 'f': // face
            // Uproszczone parsowanie twarzy (tylko wierzchołki)
            for (let i = 1; i <= 3; i++) {
              const vertexIndex = parseInt(parts[i].split('/')[0]) - 1
              indices.push(vertexIndex)
            }
            faceCount++
            break
        }
      }
      
      console.log(`✅ Model OBJ załadowany: ${vertexCount} wierzchołków, ${faceCount} twarzy`)
      return { vertices, normals, texCoords, indices }
    } catch (error) {
      console.error('❌ Błąd ładowania modelu OBJ:', error)
      return { vertices: [], normals: [], texCoords: [], indices: [] }
    }
  }

  // Inicjalizacja WebGL
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL nie jest dostępny')
      return
    }

    glRef.current = gl

    // Ustaw rozmiar canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Utwórz program shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) return

    const vertexShaderSource = `
      attribute vec3 a_position;
      attribute vec3 a_color;
      uniform mat4 u_modelViewMatrix;
      uniform mat4 u_projectionMatrix;
      varying vec3 v_color;
      
      void main() {
        gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 1.0);
        v_color = a_color;
      }
    `

    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Błąd kompilacji vertex shader:', gl.getShaderInfoLog(vertexShader))
      return
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) return

    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 v_color;
      
      void main() {
        // Dodaj lepsze oświetlenie z kierunkiem światła
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        vec3 normal = vec3(0.0, 1.0, 0.0); // Uproszczona normalna
        float diff = max(dot(normal, lightDir), 0.2);
        vec3 finalColor = v_color * (0.3 + 0.7 * diff);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Błąd kompilacji fragment shader:', gl.getShaderInfoLog(fragmentShader))
      return
    }

    // Utwórz program
    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Błąd linkowania programu:', gl.getProgramInfoLog(program))
      return
    }

    programRef.current = program
    gl.useProgram(program)

    // Włącz depth testing i blending
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0.8, 0.9, 1.0, 1.0) // Jaśniejsze niebo

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Ładowanie modeli OBJ gdy zmienia się system ogrodzeniowy
  useEffect(() => {
    if (fenceSystem && fenceSystem.objFile) {
      const modelKey = fenceSystem.id
      if (!loadedModels.has(modelKey)) {
        console.log('🔄 Rozpoczynam ładowanie modelu OBJ:', fenceSystem.objFile)
        setLoadingModels(prev => new Set([...prev, modelKey]))
        loadOBJModel(`/Ogrodzenie/${fenceSystem.objFile}`).then(model => {
          console.log('✅ Model OBJ załadowany pomyślnie:', model.vertices.length, 'wierzchołków')
          setLoadedModels(prev => new Map(prev).set(modelKey, model))
          setLoadingModels(prev => {
            const newSet = new Set(prev)
            newSet.delete(modelKey)
            return newSet
          })
        }).catch(error => {
          console.error(`❌ Błąd ładowania modelu OBJ dla ${fenceSystem.name}:`, error)
          setLoadingModels(prev => {
            const newSet = new Set(prev)
            newSet.delete(modelKey)
            return newSet
          })
        })
      }
    }
  }, [fenceSystem]) // Usunięto loadedModels z dependency array

  // Renderowanie
  useEffect(() => {
    if (!glRef.current || !programRef.current) return

    const gl = glRef.current
    const program = programRef.current

    console.log('🎬 Rozpoczynam renderowanie, elementy:', elements.length)
    if (fenceSystem) {
      console.log('🏗️ System ogrodzeniowy:', fenceSystem.name, 'OBJ:', fenceSystem.objFile)
      console.log('📦 Załadowane modele:', Array.from(loadedModels.keys()))
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Ustaw macierze transformacji
    const projectionMatrix = createProjectionMatrix(75, gl.canvas.width / gl.canvas.height, 0.1, 1000)
    const viewMatrix = createViewMatrix(camera)

    // Renderuj elementy
    elements.forEach((element, index) => {
      console.log(`🎨 Renderuję element ${index + 1}/${elements.length}:`, element.type, element.id)
      renderElement(gl, program, element, projectionMatrix, viewMatrix, element.id === selectedElementId)
    })

    // Renderuj podłoże
    renderGround(gl, program, projectionMatrix, viewMatrix)

    // Renderuj dom
    if (houseStyle) {
      renderHouse(gl, program, houseStyle, projectionMatrix, viewMatrix)
    }

    // Renderuj system ogrodzeniowy
    if (fenceSystem) {
      renderFenceSystem(gl, program, fenceSystem, projectionMatrix, viewMatrix)
    }

    console.log('✅ Renderowanie zakończone')

  }, [elements, selectedElementId, fenceSystem, houseStyle, camera])

  // Funkcje pomocnicze
  const createProjectionMatrix = (fov: number, aspect: number, near: number, far: number) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov * Math.PI / 180)
    const rangeInv = 1.0 / (near - far)
    
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ]
  }

  const createViewMatrix = (camera: any) => {
    // Uproszczona macierz widoku - kamera patrzy na punkt (0,0,0)
    const cosX = Math.cos(camera.rotX * Math.PI / 180)
    const sinX = Math.sin(camera.rotX * Math.PI / 180)
    const cosY = Math.cos(camera.rotY * Math.PI / 180)
    const sinY = Math.sin(camera.rotY * Math.PI / 180)
    
    // Macierz rotacji kamery
    const rotXMatrix = [
      1, 0, 0, 0,
      0, cosX, -sinX, 0,
      0, sinX, cosX, 0,
      0, 0, 0, 1
    ]
    
    const rotYMatrix = [
      cosY, 0, sinY, 0,
      0, 1, 0, 0,
      -sinY, 0, cosY, 0,
      0, 0, 0, 1
    ]
    
    // Macierz translacji kamery
    const transMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -camera.x, -camera.y, -camera.z, 1
    ]
    
    // Pomnóż macierze: trans * rotY * rotX
    const temp = multiplyMatrices(transMatrix, rotYMatrix)
    return multiplyMatrices(temp, rotXMatrix)
  }

  const renderElement = (gl: WebGLRenderingContext, program: WebGLProgram, element: FenceElement, projectionMatrix: number[], viewMatrix: number[], isSelected: boolean) => {
    console.log('🎨 Renderuję element:', element.type, element.id, 'pozycja:', element.position)
    
    // Sprawdź czy mamy załadowany model OBJ dla tego typu elementu
    if (fenceSystem && loadedModels.has(fenceSystem.id)) {
      const model = loadedModels.get(fenceSystem.id)!
      console.log('📦 Używam modelu OBJ:', model.vertices.length, 'wierzchołków')
      renderOBJElement(gl, program, element, projectionMatrix, viewMatrix, isSelected, model)
      return
    }
    
    console.log('🔲 Używam fallback (proste sześciany)')
    // Fallback do prostych sześcianów jeśli nie ma modelu OBJ
    const vertices = createElementGeometry(element)
    
    // Lepsze kolory dla elementów ogrodzeniowych
    let colors: number[]
    if (isSelected) {
      colors = Array(vertices.length / 3).fill([0.0, 0.8, 1.0]).flat() // Jasny niebieski dla wybranego
    } else {
      // Kolor zależny od typu elementu
      switch (element.type) {
        case 'post':
          colors = Array(vertices.length / 3).fill([0.6, 0.3, 0.1]).flat() // Jaśniejszy brązowy dla słupków
          break
        case 'section':
          colors = Array(vertices.length / 3).fill([0.8, 0.8, 0.8]).flat() // Biały dla sekcji
          break
        case 'gate':
        case 'door':
          colors = Array(vertices.length / 3).fill([0.3, 0.3, 0.3]).flat() // Ciemny szary dla bram/drzwi
          break
        default:
          colors = Array(vertices.length / 3).fill([0.7, 0.7, 0.7]).flat() // Jaśniejszy szary
      }
    }
    
    // Utwórz bufory
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    
    // Ustaw atrybuty
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    
    const colorLocation = gl.getAttribLocation(program, 'a_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)
    
    // Ustaw uniformy
    const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'u_modelViewMatrix')
    const modelViewMatrix = createModelViewMatrix(element, viewMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)
    
    // Renderuj
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3)
  }

  const renderOBJElement = (gl: WebGLRenderingContext, program: WebGLProgram, element: FenceElement, projectionMatrix: number[], viewMatrix: number[], isSelected: boolean, model: OBJModel) => {
    if (model.vertices.length === 0) return
    
    // Kolory dla elementu OBJ
    let colors: number[]
    if (isSelected) {
      colors = Array(model.vertices.length / 3).fill([0.0, 0.8, 1.0]).flat() // Jasny niebieski dla wybranego
    } else {
      switch (element.type) {
        case 'post':
          colors = Array(model.vertices.length / 3).fill([0.6, 0.3, 0.1]).flat() // Brązowy dla słupków
          break
        case 'section':
          colors = Array(model.vertices.length / 3).fill([0.8, 0.8, 0.8]).flat() // Biały dla sekcji
          break
        case 'gate':
        case 'door':
          colors = Array(model.vertices.length / 3).fill([0.3, 0.3, 0.3]).flat() // Ciemny szary dla bram/drzwi
          break
        default:
          colors = Array(model.vertices.length / 3).fill([0.7, 0.7, 0.7]).flat() // Domyślny szary
      }
    }
    
    // Utwórz bufory dla modelu OBJ
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW)
    
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
    
    // Ustaw atrybuty
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    
    const colorLocation = gl.getAttribLocation(program, 'a_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)
    
    // Ustaw uniformy
    const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'u_modelViewMatrix')
    const modelViewMatrix = createOBJModelViewMatrix(element, viewMatrix, model)
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)
    
    // Renderuj model OBJ
    if (model.indices.length > 0) {
      const indexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW)
      gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0)
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 3)
    }
  }

  const createElementGeometry = (element: FenceElement) => {
    const { width, height } = element
    const thickness = 0.2 // Grubość elementu ogrodzeniowego
    
    // Element ogrodzeniowy jako płaska ściana
    return [
      // Front face
      -width/2, 0, -thickness/2,
      width/2, 0, -thickness/2,
      width/2, height, -thickness/2,
      -width/2, 0, -thickness/2,
      width/2, height, -thickness/2,
      -width/2, height, -thickness/2,
      
      // Back face
      -width/2, 0, thickness/2,
      -width/2, height, thickness/2,
      width/2, height, thickness/2,
      -width/2, 0, thickness/2,
      width/2, height, thickness/2,
      width/2, 0, thickness/2,
      
      // Top edge
      -width/2, height, -thickness/2,
      width/2, height, -thickness/2,
      width/2, height, thickness/2,
      -width/2, height, -thickness/2,
      width/2, height, thickness/2,
      -width/2, height, thickness/2,
      
      // Bottom edge
      -width/2, 0, -thickness/2,
      -width/2, 0, thickness/2,
      width/2, 0, thickness/2,
      -width/2, 0, -thickness/2,
      width/2, 0, thickness/2,
      width/2, 0, -thickness/2,
      
      // Left edge
      -width/2, 0, -thickness/2,
      -width/2, height, -thickness/2,
      -width/2, height, thickness/2,
      -width/2, 0, -thickness/2,
      -width/2, height, thickness/2,
      -width/2, 0, thickness/2,
      
      // Right edge
      width/2, 0, -thickness/2,
      width/2, 0, thickness/2,
      width/2, height, thickness/2,
      width/2, 0, -thickness/2,
      width/2, height, thickness/2,
      width/2, height, -thickness/2
    ]
  }

  const createModelViewMatrix = (element: FenceElement, viewMatrix: number[]) => {
    // Macierz transformacji z obrotem i pozycją
    const cos = Math.cos(element.rotation * Math.PI / 180)
    const sin = Math.sin(element.rotation * Math.PI / 180)
    
    // Macierz rotacji wokół osi Y
    const rotationMatrix = [
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    ]
    
    // Macierz translacji - element na poziomie podłoża
    const translationMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      element.position.x, element.height/2, element.position.z, 1
    ]
    
    // Pomnóż macierze: view * translation * rotation
    const temp = multiplyMatrices(viewMatrix, translationMatrix)
    return multiplyMatrices(temp, rotationMatrix)
  }

  const createOBJModelViewMatrix = (element: FenceElement, viewMatrix: number[], model: OBJModel) => {
    // Oblicz skalowanie na podstawie wymaganych wymiarów elementu
    const scaleX = element.width / 2.0  // Skalowanie do szerokości elementu
    const scaleY = element.height / 2.0 // Skalowanie do wysokości elementu
    const scaleZ = 1.0 // Głębokość bez zmian
    
    // Macierz skalowania
    const scaleMatrix = [
      scaleX, 0, 0, 0,
      0, scaleY, 0, 0,
      0, 0, scaleZ, 0,
      0, 0, 0, 1
    ]
    
    // Macierz rotacji wokół osi Y
    const cos = Math.cos(element.rotation * Math.PI / 180)
    const sin = Math.sin(element.rotation * Math.PI / 180)
    const rotationMatrix = [
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    ]
    
    // Macierz translacji - element na poziomie podłoża
    const translationMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      element.position.x, element.height/2, element.position.z, 1
    ]
    
    // Pomnóż macierze: view * translation * rotation * scale
    const temp1 = multiplyMatrices(viewMatrix, translationMatrix)
    const temp2 = multiplyMatrices(temp1, rotationMatrix)
    return multiplyMatrices(temp2, scaleMatrix)
  }

  const multiplyMatrices = (a: number[], b: number[]) => {
    const result = new Array(16)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0
        for (let k = 0; k < 4; k++) {
          sum += a[i * 4 + k] * b[k * 4 + j]
        }
        result[i * 4 + j] = sum
      }
    }
    return result
  }

  const createHouseGeometry = (houseStyle: HouseStyle) => {
    // Prosta geometria domu - sześcian z dachem
    const baseSize = 8
    const height = 6
    const roofHeight = 3
    
    return [
      // Podstawa domu (sześcian)
      // Front face
      -baseSize/2, 0, -baseSize/2,
      baseSize/2, 0, -baseSize/2,
      baseSize/2, height, -baseSize/2,
      -baseSize/2, 0, -baseSize/2,
      baseSize/2, height, -baseSize/2,
      -baseSize/2, height, -baseSize/2,
      
      // Back face
      -baseSize/2, 0, baseSize/2,
      -baseSize/2, height, baseSize/2,
      baseSize/2, height, baseSize/2,
      -baseSize/2, 0, baseSize/2,
      baseSize/2, height, baseSize/2,
      baseSize/2, 0, baseSize/2,
      
      // Left face
      -baseSize/2, 0, -baseSize/2,
      -baseSize/2, height, -baseSize/2,
      -baseSize/2, height, baseSize/2,
      -baseSize/2, 0, -baseSize/2,
      -baseSize/2, height, baseSize/2,
      -baseSize/2, 0, baseSize/2,
      
      // Right face
      baseSize/2, 0, -baseSize/2,
      baseSize/2, 0, baseSize/2,
      baseSize/2, height, baseSize/2,
      baseSize/2, 0, -baseSize/2,
      baseSize/2, height, baseSize/2,
      baseSize/2, height, -baseSize/2,
      
      // Dach (trójkątne ściany)
      // Front roof
      -baseSize/2, height, -baseSize/2,
      baseSize/2, height, -baseSize/2,
      0, height + roofHeight, 0,
      
      // Back roof
      -baseSize/2, height, baseSize/2,
      0, height + roofHeight, 0,
      baseSize/2, height, baseSize/2,
      
      // Left roof
      -baseSize/2, height, -baseSize/2,
      0, height + roofHeight, 0,
      -baseSize/2, height, baseSize/2,
      
      // Right roof
      baseSize/2, height, -baseSize/2,
      baseSize/2, height, baseSize/2,
      0, height + roofHeight, 0
    ]
  }

  const renderHouse = (gl: WebGLRenderingContext, program: WebGLProgram, houseStyle: HouseStyle, projectionMatrix: number[], viewMatrix: number[]) => {
    // Renderuj dom z geometrią
    const houseVertices = createHouseGeometry(houseStyle)
    const houseColors = Array(houseVertices.length / 3).fill([0.9, 0.7, 0.5]).flat() // Jaśniejszy beżowy dla domu
    
    // Utwórz bufory dla domu
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(houseVertices), gl.STATIC_DRAW)
    
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(houseColors), gl.STATIC_DRAW)
    
    // Ustaw atrybuty
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    
    const colorLocation = gl.getAttribLocation(program, 'a_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)
    
    // Ustaw uniformy
    const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    
    const modelViewMatrixLocation = gl.getUniformLocation(program, 'u_modelViewMatrix')
    // Pozycja domu (przesunięty w lewo)
    const houseModelViewMatrix = createHouseModelViewMatrix(viewMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, houseModelViewMatrix)
    
    // Renderuj dom
    gl.drawArrays(gl.TRIANGLES, 0, houseVertices.length / 3)
  }

  const createHouseModelViewMatrix = (viewMatrix: number[]) => {
    // Macierz transformacji dla domu
    const houseHeight = 6 // Wysokość domu z createHouseGeometry
    const translation = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -20, houseHeight/2, 0, 1 // Przesunięcie w lewo i na poziomie podłoża
    ]
    
    // Pomnóż macierze: view * translation
    return multiplyMatrices(viewMatrix, translation)
  }

  const renderFenceSystem = (gl: WebGLRenderingContext, program: WebGLProgram, fenceSystem: FenceSystem, projectionMatrix: number[], viewMatrix: number[]) => {
    // Renderuj system ogrodzeniowy
    console.log('🏗️ Rendering fence system:', fenceSystem.name)
  }

  const renderGround = (gl: WebGLRenderingContext, program: WebGLProgram, projectionMatrix: number[], viewMatrix: number[]) => {
    // Prosta geometria podłogi (płaszczyzna)
    const groundVertices = [
      -50, 0, -50,
      50, 0, -50,
      50, 0, 50,
      -50, 0, -50,
      50, 0, 50,
      -50, 0, 50
    ]
    const groundColors = Array(groundVertices.length / 3).fill([0.1, 0.5, 0.1]).flat() // Ciemny zielony kolor trawy

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundVertices), gl.STATIC_DRAW)

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(groundColors), gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

    const colorLocation = gl.getAttribLocation(program, 'a_color')
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0)

    const projectionMatrixLocation = gl.getUniformLocation(program, 'u_projectionMatrix')
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)

    const modelViewMatrixLocation = gl.getUniformLocation(program, 'u_modelViewMatrix')
    // Macierz transformacji podłogi - na poziomie y=0
    const groundModelViewMatrix = multiplyMatrices(viewMatrix, [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1 // Na poziomie podłoża
    ])
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, groundModelViewMatrix)

    gl.drawArrays(gl.TRIANGLES, 0, groundVertices.length / 3)
  }

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Lewy przycisk myszy - obracanie kamery
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setCamera(prev => ({
      ...prev,
      rotY: prev.rotY + deltaX * 0.2, // Wolniejsze obracanie w poziomie
      rotX: Math.max(-60, Math.min(-10, prev.rotX + deltaY * 0.2)) // Ograniczenie kąta widoku
    }))
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setCamera(prev => ({
      ...prev,
      z: Math.max(20, Math.min(100, prev.z + e.deltaY * 0.05)) // Wolniejsze przybliżanie z ograniczeniami
    }))
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault() // Blokuj menu kontekstowe
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      
      {/* Kontrolki kamery */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setCamera({ x: 0, y: 30, z: 50, rotX: -25, rotY: 0 })}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          title="Widok ogólny"
        >
          🎯
        </button>
        <button
          onClick={() => setCamera({ x: 0, y: 20, z: 30, rotX: -20, rotY: 0 })}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          title="Widok z bliska"
        >
          🔍
        </button>
        <button
          onClick={() => setCamera({ x: 0, y: 40, z: 80, rotX: -30, rotY: 0 })}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          title="Widok z góry"
        >
          📷
        </button>
      </div>
      
      {/* Informacje */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          🎨 WebGL Canvas 3D | Elementy: {elements.length} | 
          {fenceSystem ? `System: ${fenceSystem.name}` : 'Brak systemu'} |
          Kamera: Y={camera.y.toFixed(1)}, Z={camera.z.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          💡 Lewy przycisk myszy = obracanie kamery | Kółko = przybliżanie | Przyciski = widoki
        </p>
        {fenceSystem && loadedModels.has(fenceSystem.id) && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Model 3D załadowany: {fenceSystem.objFile}
          </p>
        )}
        {fenceSystem && loadingModels.has(fenceSystem.id) && (
          <p className="text-xs text-blue-600 mt-1">
            🔄 Ładowanie modelu 3D: {fenceSystem.objFile}
          </p>
        )}
        {elements.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <p>📍 Elementy:</p>
            {elements.slice(0, 3).map(el => (
              <p key={el.id} className="ml-2">
                {el.type}: X={el.position.x.toFixed(1)}, Y={el.position.y.toFixed(1)}, Z={el.position.z.toFixed(1)}, H={el.height}
              </p>
            ))}
            {elements.length > 3 && <p className="ml-2">... i {elements.length - 3} więcej</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default Canvas3D
