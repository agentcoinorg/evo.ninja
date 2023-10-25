import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSortByColumnFunction extends ScriptFunction<{ csv: string, columnIndex: string }> {
  name: string = "csv_sortByColumn";
  parameters: any = {
    type: "object",
    properties: { 
      csv: {
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
    required: ["csv", "columnIndex"],
    additionalProperties: false
  };
}
