import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/wrap/js-engine/shims/index.ts",
  output: [
    {
      format: "cjs",
      file: "./src/wrap/js-engine/shims.ts",
      sourcemap: false,
    },
  ],
  preferConst: true,
  treeshake: false,
  plugins: [typescript(), commonjs(), resolve(), {
    renderChunk(code) {
      return `import { globalsShim } from "./shims/globals"

export const packagesShim = \n\`${code}\`;

const shimGlobals = () => {
  return Object.keys(globalsShim).map((key) => {
    const value = (globalsShim as Record<string, { shim: any, name: string }>)[key];
    return \`var \${key} = \${value.name};\`;
  }).join("\\n");
}

export const shimCode = (code: string) => \`
  \${packagesShim}

  \${shimGlobals()}
  const __temp = (async function () { 
  \${code}
  })().then(result => {
          __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
        }, error => {
          __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
        });
  clean(__temp)
\``;
    }
  }],
};
