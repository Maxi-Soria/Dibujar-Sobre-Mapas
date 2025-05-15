import { MapDrawingTool } from "@/components/map-drawing-tool"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="w-full h-full">
        <h1 className="text-3xl font-bold p-4">Herramienta de Dibujo de Mapas</h1>
        <p className="text-gray-600 px-4 pb-4">
          Sube una imagen de mapa y dibuja líneas con colores personalizados, opacidad y etiquetas de texto.
        </p>
        <MapDrawingTool />
      </div>
    </main>
  )
}
