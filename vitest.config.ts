import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Configuration distincte de `vite.config.ts` : les tests n'ont pas besoin du
 * plugin PWA (génération du service worker, précache des pictogrammes), dont le
 * coût serait payé à chaque exécution.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
