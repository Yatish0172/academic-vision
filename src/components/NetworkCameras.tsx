import React, { useEffect, useState } from "react";
import { api, type Analysis } from "../api";
import { FaceLabel } from "./FaceLabel";

interface CameraRecord {
  id: string;
  name: string;
}
interface Props {
  version: number;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
}

function useCameras(version: number) {
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<CameraRecord[]>("/cameras")
      .then((data) => {
        if (active) {
          setCameras(data);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [version]);
  return { cameras, error };
}

export function CameraManagement({ version, busy, run }: Props) {
  const { cameras, error } = useCameras(version);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  return (
    <div className="panel">
      <h2>Network cameras</h2>
      <p className="muted">
        Register RTSP streams reachable from the API server. Stream addresses
        and credentials are encrypted and are never returned to the browser.
      </p>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cameras.map((camera) => (
            <tr key={camera.id}>
              <td>{camera.name}</td>
              <td>
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api("/cameras/" + camera.id, "DELETE");
                    })
                  }
                >
                  Remove camera
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await api("/cameras", "POST", { name, url });
            setName("");
            setUrl("");
          });
        }}
      >
        <div className="form-grid">
          <label>
            Camera name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            RTSP stream URL
            <input
              type="password"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="rtsp://camera-address/stream"
              autoComplete="off"
              maxLength={2048}
            />
          </label>
        </div>
        <button className="primary" disabled={busy}>
          Add network camera
        </button>
      </form>
    </div>
  );
}

export function NetworkCapture({
  version,
  busy,
  run,
  sessionId,
  enabled,
}: Props & { sessionId: string; enabled: boolean }) {
  const { cameras, error } = useCameras(version);
  const [cameraId, setCameraId] = useState("");
  const [result, setResult] = useState<(Analysis & { image: string }) | null>(
    null,
  );
  useEffect(() => setResult(null), [sessionId, cameraId]);
  return (
    <div className="panel">
      <h2>RTSP camera capture</h2>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      <p className="muted">
        Fetch and analyze a current frame from a configured network camera. Each
        capture has a connection and read timeout.
      </p>
      <label>
        Network camera
        <select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
          <option value="">Select a camera</option>
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="primary"
        disabled={busy || !cameraId || !enabled}
        onClick={() =>
          void run(async () => {
            setResult(
              await api("/cameras/" + cameraId + "/analyze", "POST", {
                session_id: sessionId || null,
              }),
            );
          })
        }
      >
        {busy ? "Capturing…" : "Capture & analyze network camera"}
      </button>
      {result && (
        <>
          <div className="analysis-image" style={{ marginTop: 20 }}>
            <img src={result.image} alt="Analyzed RTSP camera frame" />
            {result.detections.map((d, index) => (
              <div
                key={index}
                className="face-box"
                style={{
                  left: (100 * d.box[0]) / result.width + "%",
                  top: (100 * d.box[1]) / result.height + "%",
                  width: (100 * d.box[2]) / result.width + "%",
                  height: (100 * d.box[3]) / result.height + "%",
                }}
              >
                <FaceLabel detection={d} fallback="Unmatched face" />
              </div>
            ))}
          </div>
          <p>
            {result.detections.length} face(s) detected.{" "}
            {result.mode === "preview"
              ? "Recognition preview only; no attendance saved."
              : "Candidate matches are available in the review queue."}
          </p>
          {result.detections.map((d, i) => (
            <p className="muted" key={i}>
              {d.name || "Unmatched"}
              {d.name &&
                (d.sap_id
                  ? " · SAP ID: " + d.sap_id
                  : " · SAP ID not set")}{" "}
              · {d.state} · {d.reason}
            </p>
          ))}
        </>
      )}
    </div>
  );
}
