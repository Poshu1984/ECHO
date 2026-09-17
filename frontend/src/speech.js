export function speechSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function recognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function micErrorKey(error) {
  const code = String(error?.error || error?.name || error?.message || error || "");
  if (/not-allowed|NotAllowed|Permission/i.test(code)) return "micDenied";
  if (/audio-capture|NotFound|DevicesNotFound/i.test(code)) return "micError";
  if (/not-supported|unsupported/i.test(code)) return "micOff";
  if (/aborted/i.test(code)) return "";
  if (/no-speech/i.test(code)) return "micError";
  if (/network/i.test(code)) return "micError";
  if (/busy|in-use|NotReadable|TrackStart/i.test(code)) return "micBusy";
  return "micError";
}

let mediaStream = null;

export async function openMicStream() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  if (mediaStream && mediaStream.getTracks().some((t) => t.readyState === "live")) return mediaStream;
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  return mediaStream;
}

export function closeMicStream() {
  try {
    (mediaStream?.getTracks() || []).forEach((track) => track.stop());
  } catch { /* ignore */ }
  mediaStream = null;
}

export function createRecognizer(lang, handlers = {}) {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang || "en-US";
  rec.interimResults = true;
  rec.continuous = Boolean(handlers.continuous);
  rec.maxAlternatives = 1;
  rec.onresult = (event) => {
    let interim = "";
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0]?.transcript || "";
      if (event.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    const text = (finalText || interim).trim();
    if (finalText) handlers.onFinal?.(finalText.trim());
    else if (text) handlers.onPartial?.(text);
  };
  rec.onerror = (event) => handlers.onError?.(event);
  rec.onend = () => handlers.onEnd?.();
  return rec;
}
