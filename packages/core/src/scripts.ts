import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

export interface Script {
  name: string;
  description: string;
  arguments: string;
  code: string;
}

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
  fs.readdirSync("./scripts")
    .filter(file => path.extname(file) === ".json")
    .forEach((file) => {
      const script = JSON.parse(fs.readFileSync(`./scripts/${file}`, "utf8"));

      // If "code" is a path
      if (script.code.startsWith("./")) {
        // Read it from disk
        script.code = fs.readFileSync(
          path.join("./scripts", script.code),
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
  fs.writeFileSync(`./scripts/${name}.js`, script.code);
  script.code = `./${name}.js`;
  fs.writeFileSync(`./scripts/${name}.json`, JSON.stringify(script, null, 2));
}
