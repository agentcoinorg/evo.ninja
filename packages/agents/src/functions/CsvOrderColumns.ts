import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvOrderColumnsFunction extends ScriptFunction<{ inputPath: string, outputPath: string }> {
  get name() {
    return "csv_orderColumns"
  }

  get description() {
    return "Order the columns of a CSV alphabetically"
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
        }
      },
      required: ["csvData", "delimiter"],
      additionalProperties: false
    }
  }
}