export class Timer {
  private _start: number = 0;
  private _end: number = 0;

  start(): void {
    this._start = Date.now();
  }

  end(): void {
    this._end = Date.now();
  }

  getHHMMSS(): string {
    this._validate();

    const duration = this._end - this._start;
    const hours = Math.floor(duration / 3600000); // 1 hour = 3600000 milliseconds
    const minutes = Math.floor((duration % 3600000) / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((duration % 60000) / 1000); // 1 second = 1000 milliseconds

    return `${this._pad(hours)}:${this._pad(minutes)}:${this._pad(seconds)}`;
  }

  toString() {
    return this.getHHMMSS();
  }

  toJSON() {
    return this.toString();
  }

  private _pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private _validate() {
    if (this._start === 0 || this._end === 0) {
      throw Error("You must call both start() and end().");
    }

    if (this._start > this._end) {
      throw Error("End time cannot be before start time.");
    }
  }
}
