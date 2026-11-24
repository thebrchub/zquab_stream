import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The API host the app talks to: VITE_API_BASE_URL, else the dev proxy ('')
// when serving locally, else production.
const apiHostFor = (command: string, mode: string): string => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return env.VITE_API_BASE_URL ?? (command === 'serve' ? '' : 'https://aarpaar-api.brchub.tech')
}

// Starts GET /users/me/bootstrap from the page itself, before the app's code
// has downloaded, when the zq_in hint says the visitor is logged in.
// AuthContext picks the answer up from window.__zqBoot. A plain GET with no
// custom headers, so the browser sends no CORS preflight.
const bootstrapPreload = (apiHost: string): Plugin => ({
  name: 'zq-bootstrap-preload',
  transformIndexHtml: () => [{
    tag: 'script',
    injectTo: 'head-prepend',
    children: `(function(){try{if(/(?:^|;\\s*)zq_in=1(?:;|$)/.test(document.cookie)){window.__zqBoot=fetch(${JSON.stringify(`${apiHost}/api/v1/users/me/bootstrap`)},{credentials:'include'}).then(function(r){return r.json().then(function(d){return{status:r.status,data:d}},function(){return{status:r.status,data:null}})})}}catch(e){}})();`,
  }],
})

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const apiHost = apiHostFor(command, mode)
  return {
    define: {
      __ZQ_API_HOST__: JSON.stringify(apiHost),
    },
    plugins: [
      tailwindcss(),
      react(),
      bootstrapPreload(apiHost),
    ],
    server: {
      proxy: {
        // Proxy HTTP API requests to your deployed backend
        '/api': {
          target: 'https://aarpaar-api.brchub.tech',
          changeOrigin: true,
        },
        // Public, edge-cacheable reads (/public/v1/...)
        '/public': {
          target: 'https://aarpaar-api.brchub.tech',
          changeOrigin: true,
        },
        // Proxy WebSocket connections to your deployed backend
        '/ws': {
          target: 'wss://api.zquab.com',
          changeOrigin: true,
          ws: true,
        }
      }
    }
  }
})