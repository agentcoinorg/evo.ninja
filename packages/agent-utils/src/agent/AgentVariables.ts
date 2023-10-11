export class AgentVariables {
  private _variables: Map<string, string> = new Map();

  public static Prefix = "${";
  public static Suffix = "}";

  public static hasSyntax(name: string): boolean {
    return name.startsWith(AgentVariables.Prefix) &&
      name.endsWith(AgentVariables.Suffix);
  }

  public static stripSyntax(name: string): string {
    return name.substring(
      AgentVariables.Prefix.length,
      name.length - AgentVariables.Suffix.length
    );
  }

  get(name: string): string | undefined {
    if (AgentVariables.hasSyntax(name)) {
      name = AgentVariables.stripSyntax(name);
    }

    return this._variables.get(name);
  }

  set(name: string, value: string): void {
    if (AgentVariables.hasSyntax(name)) {
      name = AgentVariables.stripSyntax(name);
    }

    this._variables.set(name, value);
  }
}
