import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csvData: string, delimiter: string, columnIndex: number, hasHeader: boolean }> {
  get name() {
    return "csv_sumColumn"
  }

  get description() {
    return "Sum a column of a CSV file."
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
        columnIndex: {
            type: "number"
        },
        hasHeader: {
            type: "boolean"
        }
      },
      required: ["csvData", "delimiter", "columnIndex", "hasHeader"],
      additionalProperties: false
    }
  }
}