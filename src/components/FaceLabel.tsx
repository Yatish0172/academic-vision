import React from "react";
import type { Detection } from "../api";

export function FaceLabel({
  detection,
  fallback,
}: {
  detection: Detection;
  fallback: string;
}) {
  return (
    <div className="face-label">
      <strong>{detection.name || fallback}</strong>
      {detection.name && (
        <small>
          {detection.sap_id ? `SAP ID: ${detection.sap_id}` : "SAP ID not set"}
        </small>
      )}
    </div>
  );
}
