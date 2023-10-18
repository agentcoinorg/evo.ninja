import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvOrderColumnsFunction extends ScriptFunction<{ csvData: string }> {
  name: string = "csv_orderColumns";
  description: string = "Order the columns of a CSV alphabetically";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string"
      }
    },
    required: ["csvData"],
    additionalProperties: false
  };
}