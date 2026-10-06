export class PausedClock {
  constructor(now) { this.now = now; this.offset = 0; this.since = null; }
  read() { return (this.since ?? this.now()) - this.offset; }
  setPaused(paused) {
    if (paused && this.since === null) this.since = this.now();
    else if (!paused && this.since !== null) { this.offset += this.now() - this.since; this.since = null; }
  }
}
