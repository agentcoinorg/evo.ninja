import { ScriptFunction } from "../ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ inputPath: string, outputPath: string, column: string }> {
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