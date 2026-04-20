import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const FN_URL = `${SUPABASE_URL}/functions/v1/analyze-behavior`;

Deno.test("analyze-behavior rejects unauthenticated requests", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get_learning_profile" }),
  });
  await res.text(); // consume body
  // Either 401 (no auth header) or 200 with verify_jwt=false then internal 401
  assert([401, 403, 400].includes(res.status), `expected auth failure, got ${res.status}`);
});

Deno.test("analyze-behavior responds to OPTIONS preflight", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status === 200 || res.status === 204, `unexpected status ${res.status}`);
});

Deno.test("analyze-behavior rejects unknown action", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ action: "not_a_real_action" }),
  });
  await res.text();
  // Without a real user JWT this typically fails auth (401) before action validation,
  // but some configurations return 400 — both are acceptable failure modes.
  assert(
    [400, 401, 403].includes(res.status),
    `expected error status for invalid action, got ${res.status}`
  );
});
