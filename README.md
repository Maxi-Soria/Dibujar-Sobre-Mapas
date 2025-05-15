# Herramienta de Dibujo de Mapas

Una aplicación web para dibujar y anotar líneas sobre imágenes de mapas, especialmente diseñada para mapear calles en el Partido de San Isidro, Argentina.

## Características

- Carga de imágenes de mapas
- Dibujo de líneas con diferentes grosores
- Personalización de color y opacidad
- Etiquetas de texto rotables
- Navegación interactiva del mapa (zoom y desplazamiento)
- Interfaz en español

## Tecnologías Utilizadas

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- HTML Canvas API
- shadcn/ui

## Instalación y Ejecución

### Requisitos Previos

- Node.js 18.0 o superior
- npm o yarn

### Pasos para Instalar

1. Clonar el repositorio:
   \`\`\`bash
   git clone https://github.com/tu-usuario/herramienta-dibujo-mapas.git
   cd herramienta-dibujo-mapas
   \`\`\`

2. Instalar dependencias:
   \`\`\`bash
   npm install
   # o
   yarn install
   \`\`\`

3. Iniciar el servidor de desarrollo:
   \`\`\`bash
   npm run dev
   # o
   yarn dev
   \`\`\`

4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Despliegue

Esta aplicación está configurada para ser desplegada en Vercel:

1. Crear una cuenta en [Vercel](https://vercel.com) si aún no tienes una.
2. Conectar tu repositorio de GitHub.
3. Configurar un nuevo proyecto en Vercel apuntando al repositorio.
4. Vercel detectará automáticamente que es un proyecto Next.js y lo desplegará.

## Configuración de la Imagen Predeterminada

La aplicación utiliza una imagen predeterminada de un mapa de San Isidro. Para cambiar esta imagen:

1. Abre el archivo `lib/constants.ts`
2. Modifica la constante `DEFAULT_MAP_IMAGE` con la URL de la nueva imagen:
   \`\`\`typescript
   export const DEFAULT_MAP_IMAGE = "https://tu-nueva-url-de-imagen.jpg"
   \`\`\`

## Uso

1. La aplicación cargará automáticamente una imagen predeterminada del mapa de San Isidro.
2. Utiliza las herramientas del panel lateral para seleccionar color, grosor y opacidad.
3. Haz clic y arrastra para dibujar líneas en el mapa.
4. Selecciona una línea existente para editarla o añadir etiquetas.
5. Mantén presionada la tecla Shift y arrastra para mover el mapa.
6. Usa la rueda del ratón o los controles de zoom para acercar o alejar.

## Licencia

[MIT](LICENSE)
\`\`\`

```gitignore file=".gitignore"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
