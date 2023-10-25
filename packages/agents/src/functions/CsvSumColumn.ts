import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csv: string, columnIndex: number, withHeader: boolean }> {
  name: string = "csv_sumColumn";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
          type: "string"
      },
      columnIndex: {
          type: "number"
      },
      withHeader: {
          type: "boolean"
      }
    },
    required: ["csv", "columnIndex", "withHeader"],
    additionalProperties: false
  };
}