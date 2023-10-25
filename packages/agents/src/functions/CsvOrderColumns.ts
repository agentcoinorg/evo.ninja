import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvOrderColumnsFunction extends ScriptFunction<{ csvData: string }> {
  name: string = "csv_orderColumns";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string",
          description: "The raw CSV data as a string string (not a file name or path)."
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