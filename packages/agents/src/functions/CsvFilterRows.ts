import { ScriptFunction } from "./utils";

export class CsvFilterRowsFunction extends ScriptFunction<{
  csv: string;
  columnName: string;
  filterValue: string;
}> {
  name: string = "csv_filterRows";
  description: string =
    "Filters and returns rows from a CSV dataset based on a specified column index and a search string";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
        type: "string",
      },
      columnName: {
        type: "string",
      },
      filterValue: {
        type: "string",
      },
      outputFile: {
        type: "string",
        description: "Write the result to a file",
      },
    },
    required: ["csv", "columnName", "filterValue", "withHeader"],
    additionalProperties: false,
  };
}
