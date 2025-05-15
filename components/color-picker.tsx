"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
}

const predefinedColors = [
  "#FF0000", // Rojo
  "#FF8000", // Naranja
  "#FFFF00", // Amarillo
  "#00FF00", // Verde
  "#0000FF", // Azul
  "#8000FF", // Púrpura
  "#FF00FF", // Magenta
  "#000000", // Negro
  "#808080", // Gris
  "#FFFFFF", // Blanco
]

export function ColorPicker({ color, onChange, disabled = false }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-10 mt-2 flex items-center justify-between",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }} />
            <span>{color}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((c) => (
            <button
              key={c}
              className={cn("w-10 h-10 rounded-full border-2", color === c ? "border-gray-900" : "border-gray-200")}
              style={{ backgroundColor: c }}
              onClick={() => {
                onChange(c)
                setOpen(false)
              }}
            />
          ))}
        </div>
        <div className="mt-4">
          <label htmlFor="custom-color" className="text-sm font-medium">
            Color Personalizado
          </label>
          <input
            id="custom-color"
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 mt-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
