import { ScriptFunction } from "../ScriptFunction"

export class AddCsvColumnFunction extends ScriptFunction<{ inputPath: string, outputPath: string, column: string, values: string[] }> {
  get name() {
    return "csv_addColumn"
  }

  get description() {
    return "Adds a new column to a CSV file and writes the output to a new file"
  }

  get parameters() {
    return {
      type: "object",
      properties: { 
        inputPath: {
            type: "string"
        },
        outputPath: {
            type: "string"
        },
        column: {
            type: "string"
        },
        values: {
            type: "array",
            items: {
                type: "string"
            }
        }
      },
      required: ["inputPath", "outputPath", "column", "values"],
      additionalProperties: false
    }
  }
}