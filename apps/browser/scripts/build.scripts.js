const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const SCRIPTS_PATH = "../../scripts";

Handlebars.registerHelper("raw", function (options) {
  return options.fn();
});

const files = fs.readdirSync(SCRIPTS_PATH);

let uniqueFilesWithoutExtension = Array.from(
  new Set(files.map((file) => file.replace(/\.[^\.]+$/, "")))
);

const generateVariableName = (name) => {
  return name.replace(/\.\w/g, (match) => match[1].toUpperCase());
};

const scripts = uniqueFilesWithoutExtension.map((name) => {
  const filePath = path.join(SCRIPTS_PATH, name);
  const definition = fs.readFileSync(filePath.concat(".json"));
  const code = fs.readFileSync(filePath.concat(".js"));
  const variableName = generateVariableName(name);

  return {
    name,
    definition,
    code: code.toString().replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("$", "\\$"),
    variableName,
  };
});

const templateFile = `import { InMemoryWorkspace, Workspace } from "@evo-ninja/agent-utils";

export function createInBrowserScripts(): InMemoryWorkspace {
  const workspace = new InMemoryWorkspace();

  const availableScripts = [
    {{#each scripts}}
    {{variableName}},
    {{/each}}
  ]
  availableScripts.forEach((script) => addScript(script, workspace));

  return workspace;
}


function addScript(
  script: { name: string; definition: string; code: string },
  scriptsWorkspace: Workspace
) {
  scriptsWorkspace.writeFileSync(script.name.concat(".json"), script.definition);
  scriptsWorkspace.writeFileSync(script.name.concat(".js"), script.code);
}

// Scripts embedded below
{{#each scripts}}
const {{variableName}} = {
    name: "{{{name}}}",
    definition: JSON.stringify({{{definition}}}),
    code: \`{{{code}}}\`
}
{{/each}}
`;

const template = Handlebars.compile(templateFile);

const scriptsFile = template({ scripts });
fs.writeFileSync("./lib/scripts.ts", scriptsFile);
