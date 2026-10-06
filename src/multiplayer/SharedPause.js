export class SharedPause {
  constructor(host) { this.host = host; this.local = true; this.peer = false; this.joined = false; this.peerReady = false; this.hydrated = host; }
  get paused() { return !this.hydrated || this.local || !this.joined || !this.peerReady || this.peer; }
  receive(state) { this.joined = true; this.peerReady = state.ready; this.peer = state.paused === true; }
}
