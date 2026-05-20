import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['bin/generated/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  dts: true
})
