/**
 * Network request metadata for subtitle testing.
 * NOTE: Per AGENTS.md policy, all hardcoded subtitle cues and translations
 * are strictly removed. The only fixtures permitted are for video L2Ryrr6txwA
 * located at public/fixtures/L2Ryrr6txwA.
 */

export const SAMPLE_AUTHENTIC_RUSSIAN_URL =
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&ei=sample&caps=asr&opi=112496729&exp=xpe&xoaf=5&hl=en&ip=0.0.0.0&ipbits=0&expire=1789803433&sparams=ip%2Cipbits%2Cexpire%2Cv%2Cei%2Ccaps%2Copi%2Cexp%2Cxoaf&signature=sample&key=yt8&lang=en&fmt=json3";

export const SAMPLE_AUTHENTIC_TIMEDTEXT_HEADERS: Record<string, string> = {
  accept: "text/xml,application/json,*/*",
  "accept-language": "ru-RU,ru;q=0.9,en;q=0.6",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  referer: "https://www.youtube.com/",
  origin: "https://www.youtube.com",
};


