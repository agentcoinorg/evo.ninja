import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvAddColumnFunction extends ScriptFunction<{ csvData: string, column: string, values: string[] }> {
  name: string = "csv_addColumn";
  description: string = "Adds a new column to a CSV";
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
      }
    },
    required: ["csvData", "column", "values"],
    additionalProperties: false
  };
}