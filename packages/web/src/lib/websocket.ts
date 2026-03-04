import type { SpeakerState } from "./types.js";

type StateCallback = (speakerId: string, state: SpeakerState) => void;

export class SpeakerSocket {
  private ws: WebSocket | null = null;
  private callbacks = new Set<StateCallback>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions = new Set<string>();

  connect(): void {
    if (this.ws) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${location.host}/ws`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      for (const id of this.subscriptions) {
        this.ws?.send(JSON.stringify({ type: "subscribe", speakerId: id }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "speaker-state") {
          const state: SpeakerState = {
            nowPlaying: msg.nowPlaying,
            volume: msg.volume,
          };
          for (const cb of this.callbacks) {
            cb(msg.speakerId, state);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  subscribe(speakerId: string): void {
    this.subscriptions.add(speakerId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "subscribe", speakerId }));
    }
  }

  unsubscribe(speakerId: string): void {
    this.subscriptions.delete(speakerId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "unsubscribe", speakerId }));
    }
  }

  onState(callback: StateCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}
