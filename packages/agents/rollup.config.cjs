const typescript = require('@rollup/plugin-typescript');
const tsConfigPaths = require("rollup-plugin-tsconfig-paths")
const json = require('@rollup/plugin-json')

module.exports = {
  input: 'src/index.ts',
  preserveSymlinks: true,
  output: {
    dir: 'build',
    format: 'cjs',
  },
  plugins: [
    json(),
    typescript(),
    tsConfigPaths(),
  ]
};