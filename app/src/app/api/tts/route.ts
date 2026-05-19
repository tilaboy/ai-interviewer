import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const VOICE_CONFIG = {
  languageCode: "en-US",
  name: "en-US-Studio-O", // Studio voice — high quality, natural female
  ssmlGender: "FEMALE" as const,
};

const AUDIO_CONFIG = {
  audioEncoding: "MP3" as const,
  speakingRate: 0.95,
  pitch: 0,
};

// Fallback voices in case Studio isn't available
const FALLBACK_VOICES = [
  "en-US-Neural2-F",  // Neural2 female
  "en-US-Neural2-C",  // Neural2 female variant
  "en-US-Wavenet-F",  // WaveNet female
];

export async function POST(request: Request) {
  // Check for credentials
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_TTS_KEY) {
    return Response.json(
      { error: "Google Cloud TTS not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_TTS_KEY." },
      { status: 500 },
    );
  }

  let body: { text: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string") {
    return Response.json({ error: "Missing text field" }, { status: 400 });
  }

  // Strip code blocks and limit length
  const cleanText = body.text
    .replace(/```[\s\S]*?```/g, "(code block omitted)")
    .slice(0, 5000);

  try {
    const client = new TextToSpeechClient(
      process.env.GOOGLE_CLOUD_TTS_KEY
        ? { apiKey: process.env.GOOGLE_CLOUD_TTS_KEY }
        : undefined
    );

    const [response] = await client.synthesizeSpeech({
      input: { text: cleanText },
      voice: VOICE_CONFIG,
      audioConfig: AUDIO_CONFIG,
    });

    if (!response.audioContent) {
      throw new Error("No audio content returned");
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    // If Studio voice fails, try fallbacks
    if (err instanceof Error && err.message.includes("voice")) {
      for (const voiceName of FALLBACK_VOICES) {
        try {
          const client = new TextToSpeechClient(
            process.env.GOOGLE_CLOUD_TTS_KEY
              ? { apiKey: process.env.GOOGLE_CLOUD_TTS_KEY }
              : undefined
          );
          const [response] = await client.synthesizeSpeech({
            input: { text: cleanText },
            voice: { languageCode: "en-US", name: voiceName },
            audioConfig: AUDIO_CONFIG,
          });
          if (response.audioContent) {
            return new Response(Buffer.from(response.audioContent as Uint8Array), {
              headers: { "Content-Type": "audio/mpeg" },
            });
          }
        } catch { continue; }
      }
    }
    const message = err instanceof Error ? err.message : "TTS failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
