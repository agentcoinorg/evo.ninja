import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class CsvSumColumnFunction extends ScriptFunction<{ csv: string, columnName: string }> {
  name: string = "csv_sumColumn";
  parameters: any = {
    type: "object",
    properties: {
      csv: {
          type: "string"
      },
      columnName: {
          type: "string"
      }
    },
    required: ["csv", "columnName"],
    additionalProperties: false
  };
}