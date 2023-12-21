import { ScriptFunction } from "./utils";

export class CsvAddColumnFunction extends ScriptFunction<{
  csv: string;
  column: string;
  values: string[];
}> {
  name: string = "csv_addColumn";
  description: string = "Adds a new column to a CSV";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
        type: "string",
      },
      column: {
        type: "string",
      },
      values: {
        type: "array",
        items: {
          type: "string",
        },
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file",
      },
    },
    required: ["csv", "column", "values"],
    additionalProperties: false,
  };
}