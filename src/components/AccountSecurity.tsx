import React, { useState } from "react";
import { api } from "../api";

export function AccountSecurity({
  busy,
  run,
  notify,
}: {
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  notify: (text: string) => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          await api("/auth/password", "POST", {
            old_password: oldPassword,
            new_password: newPassword,
          });
          setOldPassword("");
          setNewPassword("");
          notify(
            "Password changed. Your other sign-in sessions have been revoked.",
          );
        });
      }}
    >
      <h2>Your password</h2>
      <div className="form-grid">
        <label>
          Current password
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={256}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            required
            minLength={12}
            maxLength={256}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>
      <button className="primary" disabled={busy}>
        Change password
      </button>
    </form>
  );
}
