import { Workspace } from "@evo-ninja/agent-utils";
import Fuse from "fuse.js";
import path from "path-browserify";
import {Uri} from "@polywrap/core-js";

export interface Script {
  name: string;
  description: string;
  arguments: string;
  code: string;
}

export class Scripts {
  constructor(
    private _workspace: Workspace,
    private _directory?: string
  ) {
  }

  searchScripts(query: string): Script[] {
    const scripts = this.getAllScripts();

    const options = {
      keys: [
        "name",
        "description"
      ]
    };

    const fuse = new Fuse(Object.values(scripts), options);

    return fuse.search(query).map((r) => r.item);
  }

  getAllScripts(): Script[] {
    const ops: Script[] = [];
    this._workspace.readdirSync(this._toSubpath(""))
      .filter(file => path.extname(file) === ".json")
      .forEach((file) => {
        const script = JSON.parse(
          this._workspace.readFileSync(this._toSubpath(file))
        );

        // If "code" is a path
        if (script.code.startsWith("./")) {
          // Read it from disk
          script.code = this._workspace.readFileSync(
            this._toSubpath(script.code)
          );
        }
        // if "code" is a URI
        else if (Uri.isValidUri(script.code)) {
          script.code = this._getWrapScriptCode(script);
        }

        ops.push(script);
      });

    return ops;
  }

  getScriptByName(name: string): Script | undefined {
    return this.getAllScripts().find(
      (op) => op.name === name
    );
  }

  addScript(name: string, script: Script) {
    this._workspace.writeFileSync(
      this._toSubpath(`${name}.js`),
      script.code
    );
    script.code = `./${name}.js`;
    this._workspace.writeFileSync(
      this._toSubpath(`${name}.json`),
      JSON.stringify(script, null, 2)
    );
  }

  private _toSubpath(subpath: string) {
    if (this._directory) {
      return path.join(this._directory, subpath);
    } else {
      return subpath;
    }
  }

  private _getWrapScriptCode(script: Script) {
    const method = script.name.split(".").pop();
    // language=javascript
    return `const client = require("@polywrap/client-js");
const result = await client.invoke({
  uri: "${script.code}",
  method: "${method}",
  args: ${script.arguments.replace(/:\s*\w+/g, '')},
});
if (!result.ok) {
  throw Error(result.error);
}
return result.value;
`
  }
}
