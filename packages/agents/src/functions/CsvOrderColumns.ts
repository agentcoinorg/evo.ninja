import { ScriptFunction } from "./utils";

export class CsvOrderColumnsFunction extends ScriptFunction<{ csv: string }> {
  name: string = "csv_orderColumns";
  parameters: any = {
    type: "object",
    properties: { 
      csv: {
          type: "string"
      },
      outputFile: {
          type: "string",
          description: "Write the result to a file"
      }
    },
    required: ["csv"],
    additionalProperties: false
  };
}