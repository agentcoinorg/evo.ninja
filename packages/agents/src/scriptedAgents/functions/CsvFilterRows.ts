import { ScriptFunction } from "../ScriptFunction"

export class CsvFilterRowsFunction extends ScriptFunction<{ inputPath: string, outputPath: string, column: string }> {
  get name() {
    return "csv_filterRows"
  }

  get description() {
    return "Filters and returns rows from a parsed CSV dataset based on a specified column index and a search string."
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
        searchString: {
            type: "string"
        }
      },
      required: ["csvData", "delimiter", "columnIndex", "searchString"],
      additionalProperties: false
    }
  }
}