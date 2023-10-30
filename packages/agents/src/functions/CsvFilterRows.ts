import { ScriptFunction } from "./utils";

export class CsvFilterRowsFunction extends ScriptFunction<{ csv: string, columnName: string, filterValue: string }> {
  name: string = "csv_filterRows";
  parameters: any = {
    type: "object",
    properties: { 
      csv: {
        type: "string"
      },
      columnName: {
        type: "string"
      },
      filterValue: {
        type: "string"
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file"
      }
    },
    required: ["csv", "columnName", "filterValue", "withHeader"],
    additionalProperties: false
  };
}
