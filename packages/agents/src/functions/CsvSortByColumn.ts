import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSortByColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: string }> {
  name: string = "csv_sortByColumn";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string"
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
