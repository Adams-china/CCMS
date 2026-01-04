
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 针对 Gemini API 的高健壮性重试封装
 * 处理 429 (配额耗尽) 和 500 (服务器内部错误)
 */
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = JSON.stringify(error).toLowerCase();
      const isRateLimit = errorStr.includes('429') || 
                          errorStr.includes('resource_exhausted') || 
                          errorStr.includes('quota') ||
                          error?.status === 429;
      const isInternalError = errorStr.includes('500') || errorStr.includes('internal') || error?.status === 500;

      if ((isRateLimit || isInternalError) && retries < maxRetries) {
        // 429 错误使用更长的指数退避
        const multiplier = isRateLimit ? 3 : 2;
        const delay = initialDelay * Math.pow(multiplier, retries);
        console.warn(`Gemini API ${isRateLimit ? '配额受限(429)' : '服务器繁忙(500)'}. 将在 ${delay}ms 后进行第 ${retries + 1} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      
      console.error("Gemini API 在多次尝试后依然失败:", error);
      throw error;
    }
  }
}

// 辅助解码函数 (保持不变)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// 业务 API (全部通过重试封装调用)
// 使用 gemini-2.0-flash-lite-preview-02-05 以获得更快的响应速度 (修正了不存在的 2.5 lite)

export const generateOrganizerContent = async (type: string, topic: string) => {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite-preview-02-05',
      contents: `Expert assistant: Generate a structured ${type} organizer for "${topic}".
      Format as JSON:
      - VENN: { "left": "", "right": "", "both": "", "titleL": "", "titleR": "" }
      - T_CHART: { "leftHeader": "", "rightHeader": "", "rows": [["", ""]] }
      - FISHBONE: { "effect": "", "bones": [{ "category": "", "causes": [""] }] }
      - KWL: { "k": "", "w": "", "l": "" }
      - WEB_CHART: { "center": "", "branches": [""] }
      - STORY_MAP: { "title": "", "setting": "", "characters": "", "problem": "", "sequence": "", "resolution": "" }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const analyzeSpellingMistake = async (correct: string, input: string) => {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite-preview-02-05',
      contents: `Student spelled "${input}" for "${correct}". Explain spelling rule briefly. Max 15 words.`,
    });
    return response.text;
  });
};

export const generateLessonPlan = async (objective: string) => {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite-preview-02-05',
      contents: `Teacher plan for: "${objective}". Use PPPP format. Markdown.`,
    });
    return response.text;
  });
};

export const generateMessageDraft = async (scenario: string, recipientName: string) => {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite-preview-02-05',
      contents: `Draft message for: "${scenario}". Recipient: "${recipientName}". Max 60 words. Professional.`,
    });
    return response.text;
  });
};

export const analyzeStudentImage = async (imageInput: string) => {
  return callGeminiWithRetry(async () => {
    const model = 'gemini-2.0-flash-lite-preview-02-05';
    let contents;
    if (imageInput && imageInput.startsWith('data:image/') && imageInput.includes(';base64,')) {
      const [header, data] = imageInput.split(';base64,');
      const mimeType = header.split(':')[1].split(';')[0];
      contents = { parts: [ { inlineData: { mimeType, data } }, { text: "Provide feedback for this homework image. Max 40 words." } ] };
    } else {
      contents = `Feedback for: ${imageInput || "Progress review"}. Max 30 words.`;
    }
    const response = await ai.models.generateContent({ model, contents });
    return response.text;
  });
};

export const announceTTS = async (text: string, voice: 'Kore' | 'Puck' | 'Zephyr' = 'Kore') => {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const bytes = decode(base64Audio);
      const buffer = await decodeAudioData(bytes, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  });
};
