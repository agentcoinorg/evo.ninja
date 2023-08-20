import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

export interface Script {
  name: string;
  description: string;
  arguments: string;
  code: string;
}

const scriptsDir = path.join(__dirname, "../../../scripts");

export function searchScripts(query: string): Script[] {
  const scripts = getAllScripts();

  const options = {
    keys: [
      "name",
      "description"
    ]
  };

  const fuse = new Fuse(Object.values(scripts), options);

  return fuse.search(query).map((r) => r.item);
}

export function getAllScripts(): Script[] {
  const ops: Script[] = [];
  fs.readdirSync(scriptsDir)
    .filter(file => path.extname(file) === ".json")
    .forEach((file) => {
      const script = JSON.parse(fs.readFileSync(path.join(scriptsDir, file), "utf8"));

      // If "code" is a path
      if (script.code.startsWith("./")) {
        // Read it from disk
        script.code = fs.readFileSync(
          path.join(scriptsDir, script.code),
          "utf-8"
        );
      }

      ops.push(script);
    });

  return ops;
}

export function getScriptByName(name: string): Script | undefined {
  return getAllScripts().find((op) => op.name === name);
}

export function addScript(name: string, script: Script) {
  fs.writeFileSync(path.join(scriptsDir, `${name}.js`), script.code);
  script.code = `./${name}.js`;
  fs.writeFileSync(path.join(scriptsDir, `${name}.json`), JSON.stringify(script, null, 2));
}
