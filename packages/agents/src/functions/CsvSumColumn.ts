import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: number, hasHeader: boolean }> {
  get name() {
    return "csv_sumColumn"
  }

  get description() {
    return "Sum a column of a CSV"
  }

  get parameters() {
    return {
      type: "object",
      properties: { 
        csvData: {
            type: "string"
        },
        columnIndex: {
            type: "number"
        },
        hasHeader: {
            type: "boolean"
        }
      },
      required: ["csvData", "columnIndex", "hasHeader"],
      additionalProperties: false
    }
  }
}