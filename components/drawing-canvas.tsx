"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"

type Point = {
  x: number
  y: number
}

type Line = {
  id: string
  points: Point[]
  color: string
  opacity: number
  label: string
  labelRotation: number
  labelPosition?: Point
  thickness: number
}

interface DrawingCanvasProps {
  backgroundImage: string
  lines: Line[]
  currentLine: Line | null
  selectedLine: Line | null
  onStartDrawing: (x: number, y: number) => void
  onDrawing: (x: number, y: number) => void
  onEndDrawing: () => void
  onSelectLine: (line: Line) => void
  zoomLevel: number
  isRotatingLabel: boolean
  onStartRotatingLabel: () => void
  onRotateLabel: (angle: number) => void
  onEndRotatingLabel: () => void
  onUpdateLabelPosition: (lineId: string, position: Point) => void
  panOffset: { x: number; y: number }
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
}

export function DrawingCanvas({
  backgroundImage,
  lines,
  currentLine,
  selectedLine,
  onStartDrawing,
  onDrawing,
  onEndDrawing,
  onSelectLine,
  zoomLevel,
  isRotatingLabel,
  onStartRotatingLabel,
  onRotateLabel,
  onEndRotatingLabel,
  onUpdateLabelPosition,
  panOffset,
  setPanOffset,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [isDraggingLabel, setIsDraggingLabel] = useState(false)
  const [rotationStartAngle, setRotationStartAngle] = useState(0)
  const [rotationCenter, setRotationCenter] = useState<Point | null>(null)
  const [interactionMode, setInteractionMode] = useState<"draw" | "pan" | "rotate" | "drag">("draw")
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load and draw the background image
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !backgroundImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setImageLoaded(false)

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = backgroundImage

    img.onload = () => {
      setImageLoaded(true)

      // Set canvas size to match container
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Calculate scale to fit image in container while maintaining aspect ratio
      const scaleX = containerWidth / img.width
      const scaleY = containerHeight / img.height
      const baseScale = Math.min(scaleX, scaleY)

      const scaledWidth = img.width * baseScale
      const scaledHeight = img.height * baseScale

      canvas.width = containerWidth
      canvas.height = containerHeight

      setCanvasSize({ width: containerWidth, height: containerHeight })
      setImageSize({ width: scaledWidth, height: scaledHeight })
      setScale(baseScale)

      // Draw everything
      drawCanvas()
    }

    img.onerror = () => {
      console.error("Error loading image")
      setImageLoaded(true) // Still set to true to remove loading state
    }
  }, [backgroundImage])

  // Redraw canvas when lines, zoom, or pan changes
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [
    lines,
    currentLine,
    selectedLine,
    canvasSize,
    imageSize,
    zoomLevel,
    panOffset,
    hoveredLabel,
    cursorPosition,
    imageLoaded,
  ])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current || !imageLoaded) return

      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      canvasRef.current.width = containerWidth
      canvasRef.current.height = containerHeight

      setCanvasSize({ width: containerWidth, height: containerHeight })

      // Redraw everything
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = backgroundImage

      img.onload = () => {
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        const baseScale = Math.min(scaleX, scaleY)

        const scaledWidth = img.width * baseScale
        const scaledHeight = img.height * baseScale

        setImageSize({ width: scaledWidth, height: scaledHeight })
        setScale(baseScale)

        drawCanvas()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [backgroundImage, lines, currentLine, selectedLine, zoomLevel, panOffset, imageLoaded])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !backgroundImage) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = backgroundImage

    // Calculate position with zoom and pan
    const effectiveScale = scale * zoomLevel
    const scaledWidth = img.width * effectiveScale
    const scaledHeight = img.height * effectiveScale

    // Center the image
    const x = (canvasSize.width - scaledWidth) / 2 + panOffset.x
    const y = (canvasSize.height - scaledHeight) / 2 + panOffset.y

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

    // Draw all lines
    lines.forEach((line) => {
      drawLine(ctx, line, line.id === selectedLine?.id, x, y, effectiveScale)
    })

    // Draw current line being drawn
    if (currentLine) {
      drawLine(ctx, currentLine, false, x, y, effectiveScale)
    }

    // Draw rotation control if a label is selected and hovered
    if (selectedLine && hoveredLabel === selectedLine.id && selectedLine.label) {
      drawRotationControl(ctx, selectedLine, x, y, effectiveScale)
    }

    // Draw cursor position indicator for rotation
    if (interactionMode === "rotate" && cursorPosition && rotationCenter) {
      drawRotationGuide(ctx, rotationCenter, cursorPosition)
    }
  }

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    line: Line,
    isSelected: boolean,
    offsetX: number,
    offsetY: number,
    effectiveScale: number,
  ) => {
    if (line.points.length < 2) return

    ctx.beginPath()
    ctx.moveTo(offsetX + line.points[0].x * effectiveScale, offsetY + line.points[0].y * effectiveScale)

    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(offsetX + line.points[i].x * effectiveScale, offsetY + line.points[i].y * effectiveScale)
    }

    ctx.strokeStyle = line.color
    ctx.globalAlpha = line.opacity

    // Use the line's thickness property, with a default fallback
    // Apply a selection effect by making selected lines slightly thicker
    const baseThickness = line.thickness || 3
    ctx.lineWidth = isSelected ? baseThickness + 2 : baseThickness

    ctx.stroke()
    ctx.globalAlpha = 1

    // Draw label if it exists
    if (line.label) {
      // Determine label position
      let labelX, labelY

      if (line.labelPosition) {
        // Use custom position if available
        labelX = offsetX + line.labelPosition.x * effectiveScale
        labelY = offsetY + line.labelPosition.y * effectiveScale
      } else {
        // Otherwise use midpoint of the line
        const midIndex = Math.floor(line.points.length / 2)
        const midPoint = line.points[midIndex]
        labelX = offsetX + midPoint.x * effectiveScale
        labelY = offsetY + midPoint.y * effectiveScale - 15
      }

      // Draw label background for better visibility
      const isHovered = hoveredLabel === line.id
      const padding = 4
      const fontSize = 14
      ctx.font = `${fontSize}px Arial`
      const textWidth = ctx.measureText(line.label).width

      ctx.save()
      ctx.translate(labelX, labelY)
      ctx.rotate(((line.labelRotation || 0) * Math.PI) / 180)

      // Draw background
      ctx.fillStyle = isHovered || isSelected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.7)"
      ctx.fillRect(-textWidth / 2 - padding, -fontSize - padding, textWidth + padding * 2, fontSize + padding * 2)

      // Draw border if selected or hovered
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? line.color : "#666"
        ctx.lineWidth = 1
        ctx.strokeRect(-textWidth / 2 - padding, -fontSize - padding, textWidth + padding * 2, fontSize + padding * 2)
      }

      // Draw text
      ctx.fillStyle = line.color
      ctx.globalAlpha = line.opacity
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(line.label, 0, 0)

      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  const drawRotationControl = (
    ctx: CanvasRenderingContext2D,
    line: Line,
    offsetX: number,
    offsetY: number,
    effectiveScale: number,
  ) => {
    if (!line.label) return

    // Determine label position
    let labelX, labelY

    if (line.labelPosition) {
      labelX = offsetX + line.labelPosition.x * effectiveScale
      labelY = offsetY + line.labelPosition.y * effectiveScale
    } else {
      const midIndex = Math.floor(line.points.length / 2)
      const midPoint = line.points[midIndex]
      labelX = offsetX + midPoint.x * effectiveScale
      labelY = offsetY + midPoint.y * effectiveScale - 15
    }

    const textWidth = ctx.measureText(line.label).width
    const fontSize = 14
    const padding = 4

    // Draw rotation handle
    ctx.save()
    ctx.translate(labelX, labelY)

    // Draw rotation icon
    const iconSize = 16
    const iconX = textWidth / 2 + padding + iconSize / 2
    const iconY = 0

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.beginPath()
    ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = line.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(iconX, iconY, iconSize / 2 - 2, 0, Math.PI * 2)
    ctx.stroke()

    // Draw arrow
    ctx.beginPath()
    ctx.moveTo(iconX, iconY - iconSize / 4)
    ctx.lineTo(iconX + iconSize / 4, iconY)
    ctx.lineTo(iconX, iconY + iconSize / 4)
    ctx.stroke()

    ctx.restore()
  }

  const drawRotationGuide = (ctx: CanvasRenderingContext2D, center: Point, cursor: Point) => {
    // Draw a line from center to cursor
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(cursor.x, cursor.y)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)"
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    // Calculate angle
    const dx = cursor.x - center.x
    const dy = cursor.y - center.y
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    // Draw angle indicator
    ctx.beginPath()
    ctx.arc(center.x, center.y, 30, 0, (angle * Math.PI) / 180)
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"
    ctx.stroke()

    // Draw angle text
    ctx.font = "12px Arial"
    ctx.fillStyle = "black"
    ctx.fillText(`${Math.round(angle)}°`, center.x + 35, center.y - 5)
  }

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    return { x, y }
  }

  const getImageCoordinates = (canvasCoords: Point): Point => {
    // Convert canvas coordinates to image coordinates
    const effectiveScale = scale * zoomLevel
    const imageX = (canvasSize.width - imageSize.width * zoomLevel) / 2 + panOffset.x
    const imageY = (canvasSize.height - imageSize.height * zoomLevel) / 2 + panOffset.y

    // Check if point is within image bounds
    if (
      canvasCoords.x >= imageX &&
      canvasCoords.x <= imageX + imageSize.width * zoomLevel &&
      canvasCoords.y >= imageY &&
      canvasCoords.y <= imageY + imageSize.height * zoomLevel
    ) {
      return {
        x: (canvasCoords.x - imageX) / effectiveScale,
        y: (canvasCoords.y - imageY) / effectiveScale,
      }
    }

    return { x: 0, y: 0 }
  }

  const isPointNearLabel = (canvasCoords: Point, line: Line): boolean => {
    if (!line.label) return false

    const effectiveScale = scale * zoomLevel
    const imageX = (canvasSize.width - imageSize.width * zoomLevel) / 2 + panOffset.x
    const imageY = (canvasSize.height - imageSize.height * zoomLevel) / 2 + panOffset.y

    // Determine label position
    let labelX, labelY

    if (line.labelPosition) {
      labelX = imageX + line.labelPosition.x * effectiveScale
      labelY = imageY + line.labelPosition.y * effectiveScale
    } else {
      const midIndex = Math.floor(line.points.length / 2)
      const midPoint = line.points[midIndex]
      labelX = imageX + midPoint.x * effectiveScale
      labelY = imageY + midPoint.y * effectiveScale - 15
    }

    // Get canvas context to measure text
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return false

    ctx.font = "14px Arial"
    const textWidth = ctx.measureText(line.label).width
    const textHeight = 14 // Approximate height
    const padding = 4

    // Create a rectangle representing the label area
    const rect = {
      x: labelX - textWidth / 2 - padding,
      y: labelY - textHeight / 2 - padding,
      width: textWidth + padding * 2,
      height: textHeight + padding * 2,
    }

    // Check if point is inside the rectangle
    return (
      canvasCoords.x >= rect.x &&
      canvasCoords.x <= rect.x + rect.width &&
      canvasCoords.y >= rect.y &&
      canvasCoords.y <= rect.y + rect.height
    )
  }

  const isPointNearRotationControl = (canvasCoords: Point, line: Line): boolean => {
    if (!line.label) return false

    const effectiveScale = scale * zoomLevel
    const imageX = (canvasSize.width - imageSize.width * zoomLevel) / 2 + panOffset.x
    const imageY = (canvasSize.height - imageSize.height * zoomLevel) / 2 + panOffset.y

    // Determine label position
    let labelX, labelY

    if (line.labelPosition) {
      labelX = imageX + line.labelPosition.x * effectiveScale
      labelY = imageY + line.labelPosition.y * effectiveScale
    } else {
      const midIndex = Math.floor(line.points.length / 2)
      const midPoint = line.points[midIndex]
      labelX = imageX + midPoint.x * effectiveScale
      labelY = imageY + midPoint.y * effectiveScale - 15
    }

    // Get canvas context to measure text
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return false

    ctx.font = "14px Arial"
    const textWidth = ctx.measureText(line.label).width
    const padding = 4
    const iconSize = 16
    const iconX = labelX + textWidth / 2 + padding + iconSize / 2
    const iconY = labelY

    // Check if point is near the rotation control
    const dx = canvasCoords.x - iconX
    const dy = canvasCoords.y - iconY
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= iconSize / 2
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvasCoords = getCanvasCoordinates(e)
    setCursorPosition(canvasCoords)

    // Middle mouse button or shift+click for panning
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      setInteractionMode("pan")
      return
    }

    // Check if clicking on a rotation control
    if (selectedLine && hoveredLabel === selectedLine.id) {
      if (isPointNearRotationControl(canvasCoords, selectedLine)) {
        setInteractionMode("rotate")
        onStartRotatingLabel()

        // Calculate rotation center
        const effectiveScale = scale * zoomLevel
        const imageX = (canvasSize.width - imageSize.width * zoomLevel) / 2 + panOffset.x
        const imageY = (canvasSize.height - imageSize.height * zoomLevel) / 2 + panOffset.y

        let centerX, centerY

        if (selectedLine.labelPosition) {
          centerX = imageX + selectedLine.labelPosition.x * effectiveScale
          centerY = imageY + selectedLine.labelPosition.y * effectiveScale
        } else {
          const midIndex = Math.floor(selectedLine.points.length / 2)
          const midPoint = selectedLine.points[midIndex]
          centerX = imageX + midPoint.x * effectiveScale
          centerY = imageY + midPoint.y * effectiveScale - 15
        }

        setRotationCenter({ x: centerX, y: centerY })

        // Calculate initial angle
        const dx = canvasCoords.x - centerX
        const dy = canvasCoords.y - centerY
        setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI))

        return
      }

      // Check if clicking on a label for dragging
      if (isPointNearLabel(canvasCoords, selectedLine)) {
        setIsDraggingLabel(true)
        setInteractionMode("drag")
        return
      }
    }

    // Check if clicking on any label
    for (const line of lines) {
      if (line.label && isPointNearLabel(canvasCoords, line)) {
        onSelectLine(line)
        setHoveredLabel(line.id)
        return
      }
    }

    // Check if clicked on a line
    const imageCoords = getImageCoordinates(canvasCoords)
    const clickedLine = findLineAtPoint(imageCoords)
    if (clickedLine) {
      onSelectLine(clickedLine)
      return
    }

    // Start drawing
    setInteractionMode("draw")
    onStartDrawing(imageCoords.x, imageCoords.y)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasCoords = getCanvasCoordinates(e)
    setCursorPosition(canvasCoords)

    // Handle panning
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x
      const dy = e.clientY - lastPanPoint.y

      setPanOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))

      setLastPanPoint({ x: e.clientX, y: e.clientY })
      return
    }

    // Handle label rotation
    if (interactionMode === "rotate" && rotationCenter) {
      const dx = canvasCoords.x - rotationCenter.x
      const dy = canvasCoords.y - rotationCenter.y
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)

      // Calculate the difference from the start angle
      let newAngle = Math.round(angle / 5) * 5 // Snap to 5-degree increments

      // Ensure angle is between 0-360
      if (newAngle < 0) newAngle += 360
      if (newAngle >= 360) newAngle -= 360

      onRotateLabel(newAngle)
      return
    }

    // Handle label dragging
    if (interactionMode === "drag" && selectedLine && isDraggingLabel) {
      const imageCoords = getImageCoordinates(canvasCoords)
      onUpdateLabelPosition(selectedLine.id, imageCoords)
      return
    }

    // Check for hovering over labels
    let foundLabel = false
    for (const line of lines) {
      if (line.label) {
        if (isPointNearLabel(canvasCoords, line) || isPointNearRotationControl(canvasCoords, line)) {
          setHoveredLabel(line.id)
          foundLabel = true

          // Update cursor based on what we're hovering over
          if (isPointNearRotationControl(canvasCoords, line)) {
            containerRef.current!.style.cursor = "grab"
          } else {
            containerRef.current!.style.cursor = "move"
          }

          break
        }
      }
    }

    if (!foundLabel) {
      setHoveredLabel(null)

      // Reset cursor
      if (e.shiftKey) {
        containerRef.current!.style.cursor = "grab"
      } else {
        containerRef.current!.style.cursor = "crosshair"
      }
    }

    // Handle drawing
    if (interactionMode === "draw") {
      const imageCoords = getImageCoordinates(canvasCoords)
      onDrawing(imageCoords.x, imageCoords.y)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
    }

    if (interactionMode === "rotate") {
      onEndRotatingLabel()
      setRotationCenter(null)
    }

    if (isDraggingLabel) {
      setIsDraggingLabel(false)
    }

    if (interactionMode === "draw") {
      onEndDrawing()
    }

    setInteractionMode("draw")
    containerRef.current!.style.cursor = "crosshair"
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()

    const canvasCoords = getCanvasCoordinates(e)

    if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      setIsPanning(true)
      return
    }

    // Check if touching a rotation control
    if (selectedLine && hoveredLabel === selectedLine.id) {
      if (isPointNearRotationControl(canvasCoords, selectedLine)) {
        setInteractionMode("rotate")
        onStartRotatingLabel()

        // Calculate rotation center
        const effectiveScale = scale * zoomLevel
        const imageX = (canvasSize.width - imageSize.width * zoomLevel) / 2 + panOffset.x
        const imageY = (canvasSize.height - imageSize.height * zoomLevel) / 2 + panOffset.y

        let centerX, centerY

        if (selectedLine.labelPosition) {
          centerX = imageX + selectedLine.labelPosition.x * effectiveScale
          centerY = imageY + selectedLine.labelPosition.y * effectiveScale
        } else {
          const midIndex = Math.floor(selectedLine.points.length / 2)
          const midPoint = selectedLine.points[midIndex]
          centerX = imageX + midPoint.x * effectiveScale
          centerY = imageY + midPoint.y * effectiveScale - 15
        }

        setRotationCenter({ x: centerX, y: centerY })

        // Calculate initial angle
        const dx = canvasCoords.x - centerX
        const dy = canvasCoords.y - centerY
        setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI))

        return
      }

      // Check if touching a label for dragging
      if (isPointNearLabel(canvasCoords, selectedLine)) {
        setIsDraggingLabel(true)
        setInteractionMode("drag")
        return
      }
    }

    // Check if touching any label
    for (const line of lines) {
      if (line.label && isPointNearLabel(canvasCoords, line)) {
        onSelectLine(line)
        setHoveredLabel(line.id)
        return
      }
    }

    // Check if touched on a line
    const imageCoords = getImageCoordinates(canvasCoords)
    const touchedLine = findLineAtPoint(imageCoords)
    if (touchedLine) {
      onSelectLine(touchedLine)
      return
    }

    // Start drawing
    setInteractionMode("draw")
    onStartDrawing(imageCoords.x, imageCoords.y)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    const canvasCoords = getCanvasCoordinates(e)
    setCursorPosition(canvasCoords)

    if (isPanning && e.touches.length === 2) {
      // Handle pinch zoom here if needed
      return
    }

    // Handle label rotation
    if (interactionMode === "rotate" && rotationCenter) {
      const dx = canvasCoords.x - rotationCenter.x
      const dy = canvasCoords.y - rotationCenter.y
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)

      // Calculate the difference from the start angle
      let newAngle = Math.round(angle / 5) * 5 // Snap to 5-degree increments

      // Ensure angle is between 0-360
      if (newAngle < 0) newAngle += 360
      if (newAngle >= 360) newAngle -= 360

      onRotateLabel(newAngle)
      return
    }

    // Handle label dragging
    if (interactionMode === "drag" && selectedLine && isDraggingLabel) {
      const imageCoords = getImageCoordinates(canvasCoords)
      onUpdateLabelPosition(selectedLine.id, imageCoords)
      return
    }

    // Handle drawing
    if (interactionMode === "draw") {
      const imageCoords = getImageCoordinates(canvasCoords)
      onDrawing(imageCoords.x, imageCoords.y)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()

    if (isPanning) {
      setIsPanning(false)
    }

    if (interactionMode === "rotate") {
      onEndRotatingLabel()
      setRotationCenter(null)
    }

    if (isDraggingLabel) {
      setIsDraggingLabel(false)
    }

    if (interactionMode === "draw") {
      onEndDrawing()
    }

    setInteractionMode("draw")
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    // Zoom in/out with mouse wheel
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel + delta))

    // Get mouse position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Adjust pan offset to zoom toward mouse position
    if (delta > 0) {
      // Zooming in - move toward mouse
      setPanOffset((prev) => ({
        x: prev.x - (mouseX - canvasSize.width / 2) * 0.05,
        y: prev.y - (mouseY - canvasSize.height / 2) * 0.05,
      }))
    } else {
      // Zooming out - move away from mouse
      setPanOffset((prev) => ({
        x: prev.x + (mouseX - canvasSize.width / 2) * 0.05,
        y: prev.y + (mouseY - canvasSize.height / 2) * 0.05,
      }))
    }

    // Update zoom level
    // This would be set via a prop in a real implementation
    // For this example, we'll just log it
    console.log(`Zoom level: ${newZoom}`)
  }

  const findLineAtPoint = (point: Point): Line | null => {
    // Check if point is close to any line
    for (const line of lines) {
      for (let i = 0; i < line.points.length - 1; i++) {
        const p1 = line.points[i]
        const p2 = line.points[i + 1]

        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(point, p1, p2)

        // If distance is small enough, consider it a hit
        // Adjust hit detection based on line thickness
        const hitThreshold = ((line.thickness || 3) * 2) / (scale * zoomLevel)
        if (distance < hitThreshold) {
          return line
        }
      }
    }

    return null
  }

  // Calculate distance from point to line segment
  const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={(e) => {
        // Update cursor based on shift key
        if (e.shiftKey && !isPanning && interactionMode === "draw") {
          containerRef.current!.style.cursor = "grab"
        } else if (!isPanning && interactionMode === "draw") {
          containerRef.current!.style.cursor = "crosshair"
        }
      }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full ${
          isPanning
            ? "cursor-grabbing"
            : interactionMode === "rotate"
              ? "cursor-alias"
              : interactionMode === "drag"
                ? "cursor-move"
                : "cursor-crosshair"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />
    </div>
  )
}
