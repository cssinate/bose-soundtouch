import type { FastifyInstance } from "fastify";
import type { SpeakerManager } from "../speaker-manager.js";

export async function speakerRoutes(
  app: FastifyInstance,
  opts: { speakerManager: SpeakerManager },
): Promise<void> {
  const { speakerManager } = opts;

  app.get("/api/speakers", async () => {
    return speakerManager.listSpeakers();
  });

  app.get<{ Params: { id: string } }>(
    "/api/speakers/:id/now-playing",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      return speaker.getNowPlaying();
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/speakers/:id/volume",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      return speaker.getVolume();
    },
  );

  app.post<{ Params: { id: string }; Body: { level: number } }>(
    "/api/speakers/:id/volume",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      await speaker.setVolume(request.body.level);
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string }; Body: { action: string } }>(
    "/api/speakers/:id/playback",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });

      switch (request.body.action) {
        case "play":
          await speaker.play();
          break;
        case "pause":
          await speaker.pause();
          break;
        case "next":
          await speaker.nextTrack();
          break;
        case "previous":
          await speaker.previousTrack();
          break;
        case "mute":
          await speaker.mute();
          break;
        case "unmute":
          await speaker.unmute();
          break;
        default:
          return reply
            .code(400)
            .send({ error: `Unknown action: ${request.body.action}` });
      }

      return { ok: true };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/speakers/:id/presets",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      return speaker.getPresets();
    },
  );

  app.post<{ Params: { id: string }; Body: { presetId: number } }>(
    "/api/speakers/:id/presets/select",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      await speaker.selectPreset(request.body.presetId);
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string }; Body: { presetId: number; contentItem: any } }>(
    "/api/speakers/:id/presets/store",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      await speaker.storePreset(request.body.presetId, request.body.contentItem);
      return { ok: true };
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/speakers/:id/sources",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      return speaker.getSources();
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/speakers/:id/info",
    async (request, reply) => {
      const speaker = speakerManager.getSpeaker(request.params.id);
      if (!speaker) return reply.code(404).send({ error: "Speaker not found" });
      return speaker.getInfo();
    },
  );
}
