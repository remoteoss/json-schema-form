import process from 'node:process'

const isDevelopment = process.env.NODE_ENV === 'development'

/** @type {import('tsup').Options} */
const config = {
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  minify: !isDevelopment,
  target: 'es2020',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
}

export default config
