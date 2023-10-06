import { ScriptFunction } from "../ScriptFunction"

export class SortCsvColumnFunction extends ScriptFunction<{ inputPath: string, outputPath: string }> {
  get name() {
    return "csv_sortColumn"
  }

  get description() {
    return "Sorts the columns of a CSV file alphabetically and writes the sorted data to a new CSV file."
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
        }
      },
      required: ["inputPath", "outputPath"],
      additionalProperties: false
    }
  }
}