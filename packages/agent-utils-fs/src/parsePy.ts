import fs from "fs";
import path from "path-browserify";

// does not search recursively
export function getPythonDependencies(dir: string): string[] {
  const pythonFiles = fs.readdirSync(dir).filter(file => file.endsWith(".py"));

  const imports = pythonFiles.flatMap(file => {
    const filePath = path.join(dir, file);
    return parsePythonImports(filePath);
  });

  const uniqueImports = Array.from(new Set(imports));

  const externalImports = uniqueImports.filter(importName => {
    const maybeLocalPath = path.join(dir, `${importName}.py`);
    return !fs.existsSync(maybeLocalPath);
  });

  return externalImports;
}

// does not handle relative imports or sub-module imports
function parsePythonImports(filePath: string): string[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  const singleImportRegex = /^(?:import|from) ([a-zA-Z0-9_]+)(?: import [a-zA-Z0-9_*]+(?: as [a-zA-Z0-9_]+)?)?/gm;
  const multipleImportRegex = /^import ([a-zA-Z0-9_ ,]+)$/gm;
  const multipleFromImportRegex = /^from ([a-zA-Z0-9_]+) import (?:[a-zA-Z0-9_ ,]+)$/gm;

  let match;
  while (match = singleImportRegex.exec(fileContent)) {
    imports.push(match[1]);
  }
  while (match = multipleImportRegex.exec(fileContent)) {
    imports.push(...match[1].split(', ').map(item => item.trim()));
  }
  while (match = multipleFromImportRegex.exec(fileContent)) {
    imports.push(match[1]);
  }

  return imports;
}