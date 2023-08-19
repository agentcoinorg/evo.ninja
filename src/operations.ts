import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

export interface Operation {
  name: string;
  description: string;
  arguments: string;
  code: string;
}

export function searchOperations(query: string): Operation[] {
  const operations = getAllOperations();

  const options = {
    keys: [
      "name",
      "description"
    ]
  };

  const fuse = new Fuse(Object.values(operations), options);

  return fuse.search(query).map((r) => r.item);
}

export function getAllOperations(): Operation[] {
  const ops: Operation[] = [];
  fs.readdirSync("./operations").forEach((file) => {
    const operation = JSON.parse(fs.readFileSync(`./operations/${file}`, "utf8"));

    // If "code" is a path
    if (operation.code.startsWith("./")) {
      // Read it from disk
      operation.code = fs.readFileSync(
        path.join("./operations", operation.code),
        "utf-8"
      );
    }

    ops.push(operation);
  });

  return ops;
}

export function getOperationByName(name: string): Operation | undefined {
  return getAllOperations().find((op) => op.name === name);
}

export function addOperation(name: string, operation: Operation) {
  fs.writeFileSync(`./operations/${name}.js`, operation.code);
  operation.code = `./${name}.js`;
  fs.writeFileSync(`./operations/${name}.json`, JSON.stringify(operation, null, 2));
}
