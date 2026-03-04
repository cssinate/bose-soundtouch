import type { FastifyInstance } from "fastify";
import type { SpeakerManager } from "../speaker-manager.js";
import type { WebSocket } from "@fastify/websocket";

interface WsClient {
  socket: WebSocket;
  subscribedSpeakers: Set<string>;
}

export async function websocketPlugin(
  app: FastifyInstance,
  opts: { speakerManager: SpeakerManager },
): Promise<void> {
  const clients = new Set<WsClient>();
  const { speakerManager } = opts;

  app.get("/ws", { websocket: true }, (socket) => {
    const client: WsClient = {
      socket,
      subscribedSpeakers: new Set(),
    };
    clients.add(client);

    socket.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "subscribe" && msg.speakerId) {
          client.subscribedSpeakers.add(msg.speakerId);
        }

        if (msg.type === "unsubscribe" && msg.speakerId) {
          client.subscribedSpeakers.delete(msg.speakerId);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on("close", () => {
      clients.delete(client);
    });
  });

  const pollInterval = setInterval(async () => {
    const speakers = speakerManager.listSpeakers();

    for (const speaker of speakers) {
      const st = speakerManager.getSpeaker(speaker.id);
      if (!st) continue;

      try {
        const [nowPlaying, volume] = await Promise.all([
          st.getNowPlaying(),
          st.getVolume(),
        ]);

        const payload = JSON.stringify({
          type: "speaker-state",
          speakerId: speaker.id,
          nowPlaying,
          volume,
        });

        for (const client of clients) {
          if (
            client.subscribedSpeakers.has(speaker.id) &&
            client.socket.readyState === 1
          ) {
            client.socket.send(payload);
          }
        }
      } catch {
        // Speaker may be temporarily unreachable
      }
    }
  }, 2000);

  app.addHook("onClose", () => {
    clearInterval(pollInterval);
    for (const client of clients) {
      client.socket.close();
    }
  });
}
