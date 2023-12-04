export class AgentVariables {
  private _variables: Map<string, string> = new Map();
  private _funcCounters: Map<string, number> = new Map();
  private _saveThreshold: number = 1250;
  private onVariableSet?: (key: string, value: string) => Promise<void>; 

  public static Prefix = "${";
  public static Suffix = "}";

  constructor(
    config?: {
      saveThreshold?: number
      onVariableSet?: (key: string, value: string) => Promise<void>
    },
  ) {
    if (config?.saveThreshold) {
      this._saveThreshold = config.saveThreshold;
    }

    if (config?.onVariableSet) {
      this.onVariableSet = config.onVariableSet;
    }
  }

  static hasSyntax(name: string): boolean {
    return name.startsWith(AgentVariables.Prefix) &&
      name.endsWith(AgentVariables.Suffix);
  }

  static stripSyntax(name: string): string {
    return name.substring(
      AgentVariables.Prefix.length,
      name.length - AgentVariables.Suffix.length
    );
  }

  get saveThreshold(): number {
    return this._saveThreshold;
  }

  get(name: string): string | undefined {
    if (AgentVariables.hasSyntax(name)) {
      name = AgentVariables.stripSyntax(name);
    }

    return this._variables.get(name);
  }

  async set(name: string, value: string): Promise<void> {
    if (AgentVariables.hasSyntax(name)) {
      name = AgentVariables.stripSyntax(name);
    }

    this._variables.set(name, value);

    if (this.onVariableSet) {
      await this.onVariableSet(name, value);
    }
  }

  read(name: string, index: number, count: number): string {
    if (AgentVariables.hasSyntax(name)) {
      name = AgentVariables.stripSyntax(name);
    }

    const variable = this._variables.get(name);

    if (variable) {
      return variable.substring(index, count);
    } else {
      return "";
    }
  }

  async save(funcName: string, result: string): Promise<string> {
    const count = (this._funcCounters.get(funcName) || 0) + 1;
    const varName = `${funcName}_${count}`;
    this._funcCounters.set(funcName, count);
    await this.set(varName, result);
    return varName;
  }

  shouldSave(value: string, saveThreshold?: number): boolean {
    const threshold = saveThreshold || this._saveThreshold;

    // infinite
    if (threshold < 0) {
      return false;
    }

    return value.length >= threshold;
  }
}
