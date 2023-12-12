import { ScriptFunction } from "./utils";

export class CsvJoinByColumnFunction extends ScriptFunction<{
  csv1: string;
  csv2: string;
  joinColumnName: string;
}> {
  name: string = "csv_joinByColumn";
  description: string = "Join two CSVs by a shared column name";
  parameters: any = {
    type: "object",
    properties: {
      csv1: {
        type: "string",
      },
      csv2: {
        type: "string",
      },
      joinColumnName: {
        type: "string",
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file",
      },
    },
    required: ["csv1", "csv2", "joinColumnName"],
    additionalProperties: false,
  };
}