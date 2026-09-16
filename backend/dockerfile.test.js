import { readFileSync } from "fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const root = new URL("./", import.meta.url);

function localJsImports(file) {
  const text = readFileSync(new URL(file, root), "utf8");
  const names = [];
  for (const match of text.matchAll(/import\s+(?:[^'"\n]+\s+from\s+)?["']\.\/([^"']+)["']/g)) {
    const name = match[1].endsWith(".js") ? match[1] : `${match[1]}.js`;
    if (!name.startsWith("routes/")) names.push(name);
  }
  return names;
}

describe("Dockerfile", () => {
  it("copies every local root module imported at boot", () => {
    const dockerfile = readFileSync(new URL("./Dockerfile", root), "utf8");
    const needed = new Set([
      ...localJsImports("server.js"),
      ...localJsImports("store.js"),
    ]);
    assert.ok(needed.has("loadEnv.js"));
    for (const name of needed) {
      assert.match(dockerfile, new RegExp(name.replaceAll(".", "\\.")));
    }
  });
});
