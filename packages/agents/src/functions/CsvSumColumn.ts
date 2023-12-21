import { ScriptFunction } from "./utils";

export class CsvSumColumnFunction extends ScriptFunction<{
  csv: string;
  columnName: string;
}> {
  name: string = "csv_sumColumn";
  description: string = "Sum a column of a CSV";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
        type: "string",
      },
      columnName: {
        type: "string",
      },
    },
    required: ["csv", "columnName"],
    additionalProperties: false,
  };
}