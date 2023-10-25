import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvAddColumnFunction extends ScriptFunction<{ csvData: string, column: string, values: string[] }> {
  name: string = "csv_addColumn";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string"
      },
      column: {
          type: "string"
      },
      values: {
          type: "array",
          items: {
              type: "string"
          }
      },
      outputFile: {
          type: "string",
          description: "Write the result to a file"
      }
    },
    required: ["csvData", "column", "values"],
    additionalProperties: false
  };
}