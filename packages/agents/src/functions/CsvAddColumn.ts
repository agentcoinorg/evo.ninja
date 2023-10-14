import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvAddColumnFunction extends ScriptFunction<{ csvData: string, column: string, values: string[] }> {
  get name() {
    return "csv_addColumn"
  }

  get description() {
    return "Adds a new column to a CSV"
  }

  get parameters() {
    return {
      type: "object",
      properties: { 
        csvData: {
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
      required: ["csvData", "column", "values"],
      additionalProperties: false
    }
  }
}