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
    const start = this._start;
    const end = this._end === 0 ? Date.now() : this._end;

    if (this._start === 0 || end < this._start) {
      return "00:00:00";
    }

    const duration = end - start;
    const hours = Math.floor(duration / 3600000); // 1 hour = 3600000 milliseconds
    const minutes = Math.floor((duration % 3600000) / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((duration % 60000) / 1000); // 1 second = 1000 milliseconds

    return `${this._pad(hours)}:${this._pad(minutes)}:${this._pad(seconds)}`;
  }

  toString(): string {
    return this.getHHMMSS();
  }

  toJSON(): string {
    return this.toString();
  }

  private _pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}
