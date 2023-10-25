import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvOrderColumnsFunction extends ScriptFunction<{ csvData: string }> {
  name: string = "csv_orderColumns";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string"
      },
      outputFile: {
          type: "string",
          description: "Write the result to a file"
      }
    },
    required: ["csvData"],
    additionalProperties: false
  };
}