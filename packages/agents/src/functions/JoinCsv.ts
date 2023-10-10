import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class JoinCsvFunction extends ScriptFunction<{ csv1Path: string, csv2Path: string, commonColumn: string, outputPath: string }> {
  get name() {
    return "csv_join"
  }

  get description() {
    return "Reads two CSV files, merges them based on a common column, and writes the resulting data table to a new CSV file. The merged table retains all columns from both original tables."
  }

  get parameters() {
    return {
      type: "object",
      properties: { 
        csv1Path: {
            type: "string"
        },
        csv2Path: {
            type: "string"
        },
        commonColumn: {
            type: "string"
        },
        outputPath: {
            type: "string"
        }
      },
      required: ["csv1Path", "csv2Path", "commonColumn", "outputPath"],
      additionalProperties: false
    }
  }
}