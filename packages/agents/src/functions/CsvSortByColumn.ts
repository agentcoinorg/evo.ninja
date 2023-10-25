import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSortByColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: string }> {
  name: string = "csv_sortByColumn";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string",
          description: "The raw CSV data as a string string (not a file name or path)."
      },
      columnIndex: {
          type: "number"
      },
      outputFile: {
          type: "string",
          description: "Write the result to a file"
      }
    },
    required: ["csvData", "columnIndex"],
    additionalProperties: false
  };
}
