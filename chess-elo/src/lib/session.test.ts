import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPassword, createSessionToken, verifySessionToken } from "./session.ts";

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const saved = { APP_PASSWORD: process.env.APP_PASSWORD, AUTH_SECRET: process.env.AUTH_SECRET };
  Object.assign(process.env, env);
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete process.env[k];
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("without a password nothing is accepted", () => {
  withEnv({ APP_PASSWORD: undefined, AUTH_SECRET: undefined }, () => {
    assert.equal(createSessionToken(), null);
    assert.equal(checkPassword(""), false);
    assert.equal(verifySessionToken("v1.99999999999999.x"), false);
  });
});

test("password check", () => {
  withEnv({ APP_PASSWORD: "knight-e4", AUTH_SECRET: undefined }, () => {
    assert.equal(checkPassword("knight-e4"), true);
    assert.equal(checkPassword("knight-e5"), false);
    assert.equal(checkPassword(""), false);
  });
});

test("tokens verify, expire, and reject tampering", () => {
  withEnv({ APP_PASSWORD: "knight-e4", AUTH_SECRET: undefined }, () => {
    const now = Date.now();
    const { token } = createSessionToken(now)!;
    assert.equal(verifySessionToken(token, now), true);
    assert.equal(verifySessionToken(token, now + 91 * 86_400_000), false, "expired");

    const [v, exp, sig] = token.split(".");
    assert.equal(verifySessionToken(`${v}.${Number(exp) + 1}.${sig}`, now), false, "extended expiry");
    assert.equal(verifySessionToken(`${v}.${exp}.${sig.slice(0, -1)}A`, now), false, "bad signature");
    assert.equal(verifySessionToken("garbage", now), false);
    assert.equal(verifySessionToken(undefined, now), false);
  });
});

test("changing the password signs out existing sessions", () => {
  let token = "";
  withEnv({ APP_PASSWORD: "old", AUTH_SECRET: undefined }, () => {
    token = createSessionToken()!.token;
  });
  withEnv({ APP_PASSWORD: "new", AUTH_SECRET: undefined }, () => {
    assert.equal(verifySessionToken(token), false);
  });
});
