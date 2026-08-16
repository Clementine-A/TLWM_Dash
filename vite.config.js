import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin inline : traite les .geojson comme des modules JSON
const geojsonPlugin = {
  name: 'vite-plugin-geojson',
  transform(src, id) {
    if (id.endsWith('.geojson')) {
      return { code: `export default ${src}`, map: null };
    }
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), geojsonPlugin],
  server: {
    allowedHosts: true
  }
})
