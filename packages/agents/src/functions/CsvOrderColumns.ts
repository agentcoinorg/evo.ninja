import { ScriptFunction } from "./utils";

export class CsvOrderColumnsFunction extends ScriptFunction<{ csv: string }> {
  name: string = "csv_orderColumns";
  description: string = "Order the columns of a CSV alphabetically";

  parameters: any = {
    type: "object",
    properties: {
      csv: {
        type: "string",
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file",
      },
    },
    required: ["csv"],
    additionalProperties: false,
  };
}