/** @type {import('tsup').Options} */
const config = {
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  minify: true,
  target: 'es2020',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
}

export default config
