export type MotionZone = "full" | "left" | "right";
export type MotionSample = {
  percent: number;
  box: [number, number, number, number] | null;
};

// Compare low-resolution luminance frames. Remove uniform exposure changes before
// thresholding so a light switching on does not itself become a motion event.
export function compareMotion(
  previous: Uint8Array,
  current: Uint8Array,
  width: number,
  height: number,
  zone: MotionZone,
): MotionSample {
  if (previous.length !== width * height || current.length !== previous.length)
    throw new Error("Frame dimensions differ.");
  const histogram = new Uint32Array(511);
  for (let i = 0; i < current.length; i++)
    histogram[current[i] - previous[i] + 255]++;
  let cumulative = 0,
    brightness = 0;
  for (let i = 0; i < histogram.length; i++) {
    cumulative += histogram[i];
    if (cumulative > current.length / 2) {
      brightness = i - 255;
      break;
    }
  }
  const start = zone === "right" ? Math.floor(width / 2) : 0;
  const end = zone === "left" ? Math.floor(width / 2) : width;
  let changed = 0,
    minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  // A 3x3 average suppresses single-pixel sensor noise.
  for (let y = 1; y < height - 1; y++) {
    for (let x = Math.max(1, start); x < Math.min(end, width - 1); x++) {
      let delta = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const i = (y + dy) * width + x + dx;
          delta += current[i] - previous[i];
        }
      if (Math.abs(delta / 9 - brightness) < 25) continue;
      changed++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const area = (Math.min(end, width - 1) - Math.max(1, start)) * (height - 2);
  return {
    percent: area > 0 ? (changed / area) * 100 : 0,
    box: changed
      ? [
          minX / width,
          minY / height,
          (maxX - minX + 1) / width,
          (maxY - minY + 1) / height,
        ]
      : null,
  };
}

export class MotionRule {
  private since: number | null = null;
  private lastSample: number | null = null;
  private lastAlert = -Infinity;
  update(
    percent: number,
    time: number,
    threshold: number,
    durationMs: number,
  ): boolean {
    // Paused/background tabs and dropped camera frames cannot count as sustained motion.
    if (this.lastSample !== null && time - this.lastSample > 1000)
      this.since = null;
    this.lastSample = time;
    if (percent < threshold) {
      this.since = null;
      return false;
    }
    this.since ??= time;
    if (time - this.since < durationMs || time - this.lastAlert < 10000)
      return false;
    this.lastAlert = time;
    this.since = time;
    return true;
  }
}
