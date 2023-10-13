import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvFilterRowsFunction extends ScriptFunction<{ csvData: string, delimiter: string, columnIndex: number, searchString: string, withHeader: boolean }> {
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
        },
        withHeader: {
          type: "boolean"
        }
      },
      required: ["csvData", "delimiter", "columnIndex", "searchString", "withHeader"],
      additionalProperties: false
    }
  }
}
