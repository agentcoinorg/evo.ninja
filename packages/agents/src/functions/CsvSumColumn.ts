import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: number, hasHeader: boolean }> {
  name: string = "csv_sumColumn";
  description: string = "Sum a column of a CSV";
  parameters: any = {
    type: "object",
    properties: { 
      csvData: {
          type: "string"
      },
      columnIndex: {
          type: "number"
      },
      hasHeader: {
          type: "boolean"
      }
    },
    required: ["csvData", "columnIndex", "hasHeader"],
    additionalProperties: false
  };
}