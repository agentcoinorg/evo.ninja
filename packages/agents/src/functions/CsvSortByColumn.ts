import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSortByColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: string }> {
  get name() {
    return "csv_sortByColumn"
  }

  get description() {
    return "Sort a column in a CSV"
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
        }
      },
      required: ["csvData", "columnIndex"],
      additionalProperties: false
    }
  }
}
