import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvJoinByColumnFunction extends ScriptFunction<{ csv1Path: string, csv2Path: string, commonColumn: string, outputPath: string }> {
  get name() {
    return "csv_joinByColumn"
  }

  get description() {
    return "Join two CSVs by a shared column name"
  }

  get parameters() {
    return {
      type: "object",
      properties: { 
        csvData1: {
            type: "string"
        },
        csvData2: {
            type: "string"
        },
        delimiter: {
            type: "string"
        },
        joinColumnName: {
            type: "string"
        }
      },
      required: ["csvData1", "csvData2", "delimiter", "joinColumnName"],
      additionalProperties: false
    }
  }
}