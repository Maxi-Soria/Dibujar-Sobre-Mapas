"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Undo, Edit2, Check, X, ZoomIn, ZoomOut, RotateCw, Upload } from "lucide-react"
import { DrawingCanvas } from "./drawing-canvas"
import { ColorPicker } from "./color-picker"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DEFAULT_MAP_IMAGE } from "@/lib/constants"

type LineThickness = 1 | 3 | 5

type Line = {
  id: string
  points: { x: number; y: number }[]
  color: string
  opacity: number
  label: string
  labelRotation: number
  labelPosition?: { x: number; y: number }
  thickness: LineThickness
}

export function MapDrawingTool() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedLine, setSelectedLine] = useState<Line | null>(null)
  const [color, setColor] = useState("#FF0000")
  const [opacity, setOpacity] = useState(100)
  const [label, setLabel] = useState("")
  const [labelRotation, setLabelRotation] = useState(0)
  const [editingLabel, setEditingLabel] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isRotatingLabel, setIsRotatingLabel] = useState(false)
  const [thickness, setThickness] = useState<LineThickness>(3)
  const [isLoading, setIsLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load default image on component mount
  useEffect(() => {
    const loadDefaultImage = async () => {
      setIsLoading(true)
      try {
        setBackgroundImage(DEFAULT_MAP_IMAGE)
      } catch (error) {
        console.error("Error loading default image:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDefaultImage()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResetToDefaultImage = () => {
    setBackgroundImage(DEFAULT_MAP_IMAGE)
    setLines([])
    setSelectedLine(null)
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleStartDrawing = (x: number, y: number) => {
    if (selectedLine) {
      setSelectedLine(null)
      return
    }

    const newLine: Line = {
      id: Date.now().toString(),
      points: [{ x, y }],
      color,
      opacity: opacity / 100,
      label: "",
      labelRotation: labelRotation,
      thickness: thickness,
    }

    setCurrentLine(newLine)
    setIsDrawing(true)
  }

  const handleDrawing = (x: number, y: number) => {
    if (!isDrawing || !currentLine) return

    setCurrentLine({
      ...currentLine,
      points: [...currentLine.points, { x, y }],
    })
  }

  const handleEndDrawing = () => {
    if (!isDrawing || !currentLine) return

    // Calculate default label position at the midpoint of the line
    if (currentLine.points.length >= 2) {
      const midIndex = Math.floor(currentLine.points.length / 2)
      const midPoint = currentLine.points[midIndex]

      const newLine = {
        ...currentLine,
        labelPosition: { x: midPoint.x, y: midPoint.y - 15 }, // Offset slightly above the line
      }

      setLines([...lines, newLine])
    } else {
      setLines([...lines, currentLine])
    }

    setCurrentLine(null)
    setIsDrawing(false)
  }

  const handleSelectLine = (line: Line) => {
    setSelectedLine(line)
    setColor(line.color)
    setOpacity(line.opacity * 100)
    setLabel(line.label)
    setLabelRotation(line.labelRotation || 0)
    setThickness(line.thickness || 3)
  }

  const handleUpdateSelectedLine = () => {
    if (!selectedLine) return

    const updatedLines = lines.map((line) =>
      line.id === selectedLine.id ? { ...line, color, opacity: opacity / 100, label, labelRotation, thickness } : line,
    )

    setLines(updatedLines)
    setSelectedLine(null)
    setEditingLabel(false)
  }

  const handleDeleteLine = () => {
    if (!selectedLine) return

    const updatedLines = lines.filter((line) => line.id !== selectedLine.id)
    setLines(updatedLines)
    setSelectedLine(null)
  }

  const handleUndo = () => {
    if (lines.length > 0) {
      setLines(lines.slice(0, -1))
    }
  }

  const handleClearAll = () => {
    setLines([])
    setSelectedLine(null)
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  const handleStartRotatingLabel = () => {
    setIsRotatingLabel(true)
  }

  const handleRotateLabel = (angle: number) => {
    setLabelRotation(angle)

    if (selectedLine) {
      const updatedLines = lines.map((line) => (line.id === selectedLine.id ? { ...line, labelRotation: angle } : line))
      setLines(updatedLines)
    }
  }

  const handleEndRotatingLabel = () => {
    setIsRotatingLabel(false)
  }

  const handleUpdateLabelPosition = (lineId: string, position: { x: number; y: number }) => {
    const updatedLines = lines.map((line) => (line.id === lineId ? { ...line, labelPosition: position } : line))
    setLines(updatedLines)
  }

  const handleThicknessChange = (value: LineThickness) => {
    setThickness(value)
  }

  // For panning functionality
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })

  const resetPanOffset = () => {
    setPanOffset({ x: 0, y: 0 })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Main drawing area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="relative h-full">
          <DrawingCanvas
            backgroundImage={backgroundImage || DEFAULT_MAP_IMAGE}
            lines={lines}
            currentLine={currentLine}
            selectedLine={selectedLine}
            onStartDrawing={handleStartDrawing}
            onDrawing={handleDrawing}
            onEndDrawing={handleEndDrawing}
            onSelectLine={handleSelectLine}
            zoomLevel={zoomLevel}
            isRotatingLabel={isRotatingLabel}
            onStartRotatingLabel={handleStartRotatingLabel}
            onRotateLabel={handleRotateLabel}
            onEndRotatingLabel={handleEndRotatingLabel}
            onUpdateLabelPosition={handleUpdateLabelPosition}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
          />

          {/* Floating zoom controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
            <Button size="icon" variant="outline" onClick={handleZoomIn} title="Acercar">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleZoomOut} title="Alejar">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleResetZoom} title="Restablecer zoom">
              <div className="text-xs font-bold">1:1</div>
            </Button>
            <Button size="icon" variant="outline" onClick={resetPanOffset} title="Centrar mapa">
              <div className="text-xs font-bold">↔</div>
            </Button>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-4 bg-white/80 backdrop-blur-sm border-t">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
            <Upload className="mr-2 h-4 w-4" /> Subir Imagen
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button variant="outline" onClick={handleResetToDefaultImage} className="flex-1">
            Imagen Predeterminada
          </Button>
          <Button variant="outline" onClick={handleUndo} disabled={lines.length === 0} className="flex-1">
            <Undo className="mr-2 h-4 w-4" /> Deshacer
          </Button>
          <Button variant="outline" onClick={handleClearAll} disabled={lines.length === 0} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" /> Borrar Todo
          </Button>
        </div>
      </div>

      {/* Persistent sidebar */}
      <div className="w-80 h-full bg-gray-50 border-l overflow-y-auto flex flex-col">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Herramientas de Dibujo</h2>

          <div className="space-y-6">
            <div>
              <Label htmlFor="color-picker">Color de Línea</Label>
              <ColorPicker color={color} onChange={setColor} />
            </div>

            <div>
              <Label htmlFor="thickness-selector" className="block mb-2">
                Grosor de Línea
              </Label>
              <RadioGroup
                id="thickness-selector"
                value={thickness.toString()}
                onValueChange={(value) => handleThicknessChange(Number.parseInt(value) as LineThickness)}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="thickness-1" />
                    <Label htmlFor="thickness-1">Fino</Label>
                  </div>
                  <div className="w-12 h-1 bg-black rounded-full" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="thickness-3" />
                    <Label htmlFor="thickness-3">Medio</Label>
                  </div>
                  <div className="w-12 h-3 bg-black rounded-full" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5" id="thickness-5" />
                    <Label htmlFor="thickness-5">Grueso</Label>
                  </div>
                  <div className="w-12 h-5 bg-black rounded-full" />
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="opacity-slider">Opacidad: {opacity}%</Label>
              <Slider
                id="opacity-slider"
                min={0}
                max={100}
                step={1}
                value={[opacity]}
                onValueChange={(value) => setOpacity(value[0])}
                className="mt-2"
              />
            </div>

            {selectedLine ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label-input">Etiqueta de Texto</Label>
                  {editingLabel ? (
                    <div className="flex mt-2">
                      <Input
                        id="label-input"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" variant="ghost" onClick={() => setEditingLabel(false)} className="ml-2">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleUpdateSelectedLine} className="ml-2">
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex mt-2">
                      <div className="flex-1 border rounded-md px-3 py-2 bg-white">
                        {selectedLine.label || "Sin etiqueta"}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setEditingLabel(true)} className="ml-2">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="rotation-slider">Rotación de Etiqueta: {labelRotation}°</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Slider
                      id="rotation-slider"
                      min={0}
                      max={360}
                      step={5}
                      value={[labelRotation]}
                      onValueChange={(value) => handleRotateLabel(value[0])}
                      className="flex-1"
                    />
                    <Button size="icon" variant="outline" onClick={() => handleRotateLabel(0)}>
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    También puedes rotar la etiqueta directamente en el mapa usando el control de rotación.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleUpdateSelectedLine} className="flex-1">
                    Actualizar Línea
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteLine} className="flex-1">
                    Eliminar Línea
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Dibuja una línea o selecciona una existente para editar</div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        <div className="p-4 mt-auto">
          <h3 className="font-medium mb-2">Instrucciones:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Haz clic y arrastra para dibujar líneas</li>
            <li>• Selecciona el grosor de línea deseado antes de dibujar</li>
            <li>• Mantén presionada la tecla Shift y arrastra para mover el mapa</li>
            <li>• Haz clic en una línea para seleccionarla y editarla</li>
            <li>• Usa la rueda del ratón para hacer zoom</li>
            <li>• Arrastra el control de rotación para girar las etiquetas</li>
            <li>• Arrastra las etiquetas para reposicionarlas</li>
            <li>• Personaliza el color, la opacidad y añade etiquetas</li>
            <li>• Usa deshacer para eliminar la última línea</li>
            <li>• Borrar todo para comenzar de nuevo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
