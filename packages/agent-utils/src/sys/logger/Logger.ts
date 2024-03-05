import figlet from "figlet";

export interface ILogger {
  info: (info: string) => Promise<void>;
  notice: (msg: string) => Promise<void>;
  success: (msg: string) => Promise<void>;
  warning: (msg: string) => Promise<void>;
  error: (msg: string, error?: unknown) => Promise<void>;
}

export interface LoggerCallbacks {
  promptUser: (query: string) => Promise<string>;
}

export class Logger implements ILogger {
  protected _logDir: string = "chats";

  constructor(
    protected _loggers: ILogger[],
    protected _callbacks: LoggerCallbacks
  ) {}

  async info(info: string): Promise<void> {
    await Promise.all(this._loggers.map((l) => l.info(info)));
  }

  async notice(msg: string): Promise<void> {
    await Promise.all(this._loggers.map((l) => l.notice(msg)));
  }

  async success(msg: string): Promise<void> {
    await Promise.all(this._loggers.map((l) => l.success(msg)));
  }

  async warning(msg: string): Promise<void> {
    await Promise.all(this._loggers.map((l) => l.warning(msg)));
  }

  async error(msg: string, error?: unknown): Promise<void> {
    if (!error) {
      await Promise.all(this._loggers.map((l) => l.error(msg)));
      return;
    }

    let errorStr: string = "";
    let errorObj = error as Record<string, unknown>;
    if (typeof error === "object" && errorObj.message) {
      if (errorObj.response) {
        const responseObj = errorObj.response as Record<string, unknown>;
        const status = responseObj.status || "N/A";
        const data = responseObj.data || "N/A";
        errorStr += `\nResponse Status: ${status}`;
        errorStr += `\nResponse Data: ${JSON.stringify(data, null, 2)}`;
      }
      errorStr += `\nMessage: ${errorObj.message}`;
    }

    await Promise.all(this._loggers.map((l) => l.error(`${msg}${errorStr}`)));
  }

  async prompt(query: string): Promise<string> {
    return this._callbacks.promptUser(query);
  }

  async logHeader(): Promise<void> {
    const logger = this;

    return new Promise<void>((resolve, reject) => {
      figlet.text(
        "Evo.Ninja",
        {
          font: "Doom",
          horizontalLayout: "default",
          verticalLayout: "default",
          whitespaceBreak: true,
        },
        async function (err: Error | null, data?: string) {
          if (err) {
            await logger.error("Something went wrong...", err);
            reject(err);
            return;
          }
          await logger.info("```\n" + data + "\n```\n");
          await logger.info("Support: https://discord.gg/k7UCsH3ps9");
          resolve();
        }
      );
    });
  }
}
