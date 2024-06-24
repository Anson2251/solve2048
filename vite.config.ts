import { defineConfig } from 'vite'

export default defineConfig({
    root: "src",
    base: "./",
    publicDir: "assets/",
    build: {
        outDir: "../dist"
    }
})