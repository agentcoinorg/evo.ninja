import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvJoinByColumnFunction extends ScriptFunction<{ csv1Path: string, csv2Path: string, joinColumnName: string }> {
  name: string = "csv_joinByColumn";
  parameters: any = {
    type: "object",
    properties: { 
      csvData1: {
          type: "string",
          description: "The raw CSV data as a string string (not a file name or path)."
      },
      csvData2: {
          type: "string",
          description: "The raw CSV data as a string string (not a file name or path)."
      },
      joinColumnName: {
          type: "string"
      },
      outputFile: {
          type: "string",
          description: "Write the result to a file"
      }
    },
    required: ["csvData1", "csvData2", "joinColumnName"],
    additionalProperties: false
  };
}