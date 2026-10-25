import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes("const isVideoPlayingRef = useRef(isVideoPlaying);"),
  "Playback state must be available to the stable player effect through a ref",
);
assert.ok(
  indexContent.includes("isVideoPlayingRef.current = isVideoPlaying;"),
  "The playback-state ref must stay synchronized with React state",
);
assert.ok(
  indexContent.includes("}, [videoId, isAndroid, workflowMode, playerContainerNode]);"),
  "Video player lifecycle must not restart when isVideoPlaying changes",
);
assert.ok(
  indexContent.includes(
    "(p.getPlayerState ? p.getPlayerState() === 1 : isVideoPlayingRef.current)",
  ),
  "Background playback state must read the current state without restarting the player",
);

console.log("PASS: Playback state changes no longer destroy and recreate the video player.");
