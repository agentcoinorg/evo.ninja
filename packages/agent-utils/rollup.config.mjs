import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/scripts/js-engine/shims/index.ts",
  output: [
    {
      format: "cjs",
      file: "./src/scripts/js-engine/shims.ts",
      sourcemap: false,
    },
  ],
  preferConst: true,
  treeshake: false,
  plugins: [typescript(), commonjs(), resolve(), {
    renderChunk(code) {
      return `import { globalToShimVarNameMap } from "./shims/globals";
export const packagesShim = \n\`${code.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("$", "\\$")}\`;

export const shimCode = (code: string) => \`
  \${packagesShim}

  \${Object.entries(globalToShimVarNameMap).map(([global, shim]) => \`var \${global} = \${shim};\`).join("\\n")}

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
