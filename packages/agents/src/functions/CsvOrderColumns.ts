import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvOrderColumnsFunction extends ScriptFunction<{ csvData: string }> {
  name: string = "csv_orderColumns";
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