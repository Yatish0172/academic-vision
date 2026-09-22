import { useEffect, useRef, useState, type RefObject } from "react";
import {
  compareMotion,
  MotionRule,
  type MotionSample,
  type MotionZone,
} from "../motion";

type Event = {
  id: number;
  time: string;
  percent: number;
  zone: MotionZone;
  threshold: number;
  duration: number;
  reviewed: boolean;
};
const zoneNames = {
  full: "Whole camera view",
  left: "Left half of camera view",
  right: "Right half of camera view",
};

export function MotionMonitor({
  video,
  active,
}: {
  video: RefObject<HTMLVideoElement>;
  active: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [zone, setZone] = useState<MotionZone>("full");
  const [threshold, setThreshold] = useState(12);
  const [duration, setDuration] = useState(2);
  const [sample, setSample] = useState<MotionSample | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);
  const eventId = useRef(0);
  useEffect(() => {
    setSample(null);
    setError("");
    const display = preview.current;
    display?.getContext("2d")?.clearRect(0, 0, display.width, display.height);
    if (!active || !enabled) return;
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setError("Motion monitoring requires canvas support.");
      return;
    }
    let previous: Uint8Array | null = null;
    let lastVideoTime = -1;
    const rule = new MotionRule();
    const timer = window.setInterval(() => {
      const source = video.current;
      if (
        !source ||
        source.readyState < 2 ||
        source.paused ||
        source.ended ||
        document.hidden
      ) {
        previous = null;
        setSample(null);
        return;
      }
      if (source.currentTime === lastVideoTime) return;
      lastVideoTime = source.currentTime;
      try {
        ctx.drawImage(source, 0, 0, 160, 90);
        const pixels = ctx.getImageData(0, 0, 160, 90).data;
        const gray = new Uint8Array(160 * 90);
        for (let i = 0; i < gray.length; i++)
          gray[i] = Math.round(
            pixels[i * 4] * 0.299 +
              pixels[i * 4 + 1] * 0.587 +
              pixels[i * 4 + 2] * 0.114,
          );
        const next = previous
          ? compareMotion(previous, gray, 160, 90, zone)
          : null;
        previous = gray;
        setSample(next);
        const view = preview.current;
        const paint = view?.getContext("2d");
        if (view && paint) {
          view.height = Math.round(
            (view.width * source.videoHeight) / source.videoWidth,
          );
          paint.drawImage(source, 0, 0, view.width, view.height);
          if (zone !== "full") {
            paint.fillStyle = "rgba(0,0,0,.55)";
            paint.fillRect(
              zone === "left" ? view.width / 2 : 0,
              0,
              view.width / 2,
              view.height,
            );
          }
          if (next?.box && next.percent >= 1) {
            const [x, y, w, h] = next.box;
            paint.strokeStyle = "#f59e0b";
            paint.lineWidth = 3;
            paint.strokeRect(
              x * view.width,
              y * view.height,
              w * view.width,
              h * view.height,
            );
          }
        }
        if (
          next &&
          rule.update(
            next.percent,
            performance.now(),
            threshold,
            duration * 1000,
          )
        ) {
          const event: Event = {
            id: ++eventId.current,
            time: new Date().toLocaleTimeString(),
            percent: next.percent,
            zone,
            threshold,
            duration,
            reviewed: false,
          };
          setEvents((current) => [event, ...current].slice(0, 50));
        }
      } catch {
        setError("Could not read camera frames. Stop and restart the camera.");
        setEnabled(false);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [video, active, enabled, zone, threshold, duration]);

  return (
    <section className="panel" aria-label="Motion and activity monitoring">
      <h2>Motion and activity alerts</h2>
      <p className="muted">
        Flag sustained movement across the view or within a selected area. These
        rules measure visible movement; they do not identify misconduct, falls,
        or intent. Keep the camera stationary.
      </p>
      <label className="inline-label">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enable motion monitoring
      </label>
      <div className="form-grid">
        <label>
          Monitored area
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value as MotionZone)}
          >
            {Object.entries(zoneNames).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Movement threshold ({threshold}% of area)
          <input
            aria-label="Movement threshold"
            type="range"
            min={1}
            max={60}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </label>
        <label>
          Minimum sustained movement
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={1}>1 second</option>
            <option value={2}>2 seconds</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
          </select>
        </label>
      </div>
      <p role="status" data-testid="motion-status">
        {!enabled
          ? "Motion monitoring is off."
          : !active
            ? "Start the camera to monitor motion."
            : !sample
              ? "Waiting for camera frames…"
              : `${sample.percent.toFixed(1)}% movement · ${sample.percent >= threshold ? "Above threshold" : "Below threshold"}`}
      </p>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      <canvas
        ref={preview}
        width={480}
        height={270}
        aria-label="Motion preview with amber movement box"
        style={{
          display: active && enabled ? "block" : "none",
          width: "100%",
          maxWidth: 480,
          borderRadius: 12,
        }}
      />
      <p className="muted">
        Runs locally in this browser at 5 samples/second, independently of face
        recognition. Camera shake and changing shadows can trigger alerts.
        Latest 50 events are kept only while this page is open; no attendance
        changes or video recordings. Repeated alerts are limited to one every 10
        seconds.
      </p>
      <div className="panel-heading">
        <h3>Activity events ({events.length})</h3>
        <button disabled={!events.length} onClick={() => setEvents([])}>
          Clear activity events
        </button>
      </div>
      {!events.length ? (
        <p>No activity events yet.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Trigger</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.time}</td>
                  <td>
                    {event.zone === "full"
                      ? "Sustained high movement"
                      : "Movement in monitored area"}
                    <small>{zoneNames[event.zone]}</small>
                  </td>
                  <td>
                    {event.percent.toFixed(1)}% movement
                    <small>
                      At least {event.threshold}% for {event.duration}s
                    </small>
                  </td>
                  <td>
                    {event.reviewed ? (
                      "Reviewed"
                    ) : (
                      <button
                        onClick={() =>
                          setEvents((current) =>
                            current.map((item) =>
                              item.id === event.id
                                ? { ...item, reviewed: true }
                                : item,
                            ),
                          )
                        }
                      >
                        Mark reviewed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
