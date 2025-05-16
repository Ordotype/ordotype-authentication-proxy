import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        minify: true,
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'OrdotypeAuthenticationProxy',
            // the proper extensions will be added
            fileName: 'ordotype-authentication-proxy',
        },
    },
    server:{
        port: 3022,
    }
})