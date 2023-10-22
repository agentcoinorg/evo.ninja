import { AgentContext } from "../../AgentContext";
import { StandardRagBuilder } from "./StandardRagBuilder";

export class Rag {
  // static text(context: AgentContext): TextRagBuilder {
  //   return new TextRagBuilder(context);
  // }

  static standard<TItem = string>(context: AgentContext): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(context);
  }
}
