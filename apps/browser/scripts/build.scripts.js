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

export async function createInBrowserScripts(): Promise<InMemoryWorkspace> {
  const workspace = new InMemoryWorkspace();

  const availableScripts = [
    {{#each scripts}}
    {{variableName}},
    {{/each}}
  ];

  await Promise.all(
    availableScripts.map((script) => addScript(script, workspace))
  );

  return workspace;
}


async function addScript(
  script: { name: string; definition: string; code: string },
  scriptsWorkspace: Workspace
): Promise<void> {
  await scriptsWorkspace.writeFile(script.name.concat(".json"), script.definition);
  await scriptsWorkspace.writeFile(script.name.concat(".js"), script.code);
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
fs.writeFileSync("./src/scripts.ts", scriptsFile);
