import { ScriptFunction } from "../ScriptFunction"

export class SortCsvFunction extends ScriptFunction<{ inputPath: string, outputPath: string, column: string }> {
  get name() {
    return "csv_sort"
  }

  get description() {
    return "Sorts a CSV file by a specific column and writes the sorted data to a new CSV file"
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
        }
      },
      required: ["inputPath", "outputPath", "column"],
      additionalProperties: false
    }
  }
}