import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/wrap/js-engine/shims/index.ts",
  output: [
    {
      format: "cjs",
      file: "./src/wrap/js-engine/new-shims.ts",
      sourcemap: false,
    },
  ],
  preferConst: true,
  treeshake: false,
  plugins: [typescript(), commonjs(), resolve(), {
    renderChunk(code) {
      return `export const packagesShim = \n\`${code}\`;
      
      
      export const shimCode = (code: string) => \`\${packagesShim}\nconst __temp = (async function () { \n\${code}\n })().then(result => {
        __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
      }, error => {
        __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
      });\nclean(__temp)\`;
      `;
    }
  }],
};
