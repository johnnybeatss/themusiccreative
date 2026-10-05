"use client";

import { useEffect, useState } from "react";
import { HONEYPOT_FIELD, STARTED_AT_FIELD } from "@/lib/formGuard";

// Drop inside any public <form>. Fetch/JSON forms: read both fields with
// new FormData(form) and include them in the request body.
// Renders a field humans never see (bots
// fill it) and a timestamp of when the form appeared. Server side,
// looksLikeSpam() in src/lib/formGuard.ts checks both.
export default function HoneypotFields() {
  const [startedAt, setStartedAt] = useState("");
  useEffect(() => setStartedAt(String(Date.now())), []);

  return (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Leave this empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name={STARTED_AT_FIELD} value={startedAt} readOnly />
    </>
  );
}
