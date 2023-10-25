import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csvData: string, columnIndex: number, withHeader: boolean }> {
  name: string = "csv_sumColumn";
  parameters: any = {
    type: "object",
    properties: {
      csvData: {
          type: "string"
      },
      columnIndex: {
          type: "number"
      },
      withHeader: {
          type: "boolean"
      }
    },
    required: ["csvData", "columnIndex", "withHeader"],
    additionalProperties: false
  };
}