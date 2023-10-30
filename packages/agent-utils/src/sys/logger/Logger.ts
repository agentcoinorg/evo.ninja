import figlet from "figlet";

export interface ILogger {
  info: (info: string) => void;
  notice: (msg: string) => void;
  success: (msg: string) => void;
  warning: (msg: string) => void;
  error: (msg: string, error?: unknown) => void;
}

export interface LoggerCallbacks {
  promptUser: (query: string) => Promise<string>;
  logUserPrompt: (response: string) => void;
}

export class Logger implements ILogger {
  protected _logDir: string = "chats";

  constructor(
    protected _loggers: ILogger[],
    protected _callbacks: LoggerCallbacks
  ) { }

  info(info: string) {
    this._loggers.forEach((l) => l.info(info));
  }

  notice(msg: string) {
    this._loggers.forEach((l) => l.notice(msg));
  }

  success(msg: string) {
    this._loggers.forEach((l) => l.success(msg));
  }

  warning(msg: string) {
    this._loggers.forEach((l) => l.warning(msg));
  }

  error(msg: string, error?: unknown) {
    if (!error) {
      this._loggers.forEach((l) => l.error(msg));
      return;
    }

    let errorStr: string = "";
    let errorObj = error as Record<string, unknown>;
    if (
      typeof error === "object" &&
      errorObj.message
    ) {
      if (errorObj.response) {
        const responseObj = errorObj.response as Record<string, unknown>;
        const status = responseObj.status || "N/A";
        const data = responseObj.data || "N/A";
        errorStr += `\nResponse Status: ${status}`;
        errorStr += `\nResponse Data: ${JSON.stringify(data, null, 2)}`;
      }
      errorStr += `\nMessage: ${errorObj.message}`;
    }

    this._loggers.forEach((l) => l.error(`${msg}${errorStr}`));
  }

  async prompt(query: string): Promise<string> {
    const response = await this._callbacks.promptUser(query);
    this._callbacks.logUserPrompt(response);
    return response;
  }

  async logHeader(): Promise<void> {
    const logger = this;

    return new Promise<void>((resolve, reject) => {
      figlet.text("Evo.Ninja", {
        font: "Doom",
        horizontalLayout: "default",
        verticalLayout: "default",
        whitespaceBreak: true
      }, function(err: Error | null, data?: string) {
        if (err) {
          logger.error("Something went wrong...", err);
          reject(err);
          return;
        }
        logger.info("```\n" + data + "\n```\n");
        logger.info("Support: https://discord.gg/ZUSDVhA2Vz");
        resolve();
      });
    });
  }
}
