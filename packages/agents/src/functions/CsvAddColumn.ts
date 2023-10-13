import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvAddColumnFunction extends ScriptFunction<{ csvData: string, delimiter: string, column: string, values: string[] }> {
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
        delimiter: {
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
      required: ["csvData", "delimiter", "column", "values"],
      additionalProperties: false
    }
  }
}