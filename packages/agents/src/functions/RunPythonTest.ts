import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface RunPythonTestFuncParameters {
  filename: string
}

export class RunPythonTestFunction extends ScriptFunction<RunPythonTestFuncParameters> {
  get name() {
    return "python_runTest"
  }

  get description() {
    return "Run a python test given a file name"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        filename: {
          type: "string",
        }
      },
      required: ["filename"],
      additionalProperties: false
    }
  }
}