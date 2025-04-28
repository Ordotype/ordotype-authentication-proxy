import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        minify: 'terser',
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'OrdotypeAuthenticationProxy',
            // the proper extensions will be added
            fileName: 'ordotype-authentication-proxy',
        },
        rollupOptions: {
            // // make sure to externalize deps that shouldn't be bundled
            // // into your library
            // external: ['vue'],
            // output: {
            //     // Provide global variables to use in the UMD build
            //     // for externalized deps
            //     globals: {
            //         vue: 'Vue',
            //     },
            // },
        },
    },
})