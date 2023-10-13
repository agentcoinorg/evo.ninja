import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSortByColumnFunction extends ScriptFunction<{ inputPath: string, outputPath: string, column: string }> {
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
        delimiter: {
            type: "string"
        },
        columnIndex: {
            type: "string"
        }
      },
      required: ["inputPath", "outputPath", "columnIndex"],
      additionalProperties: false
    }
  }
}
