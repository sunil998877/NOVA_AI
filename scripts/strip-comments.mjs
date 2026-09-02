import fs from "node:fs";
import path from "node:path";
import { parse } from "../frontend/node_modules/@babel/parser/lib/index.js";

const ROOT = process.cwd();
const FRONTEND = path.join(ROOT, "frontend/src");
const BACKEND = path.join(ROOT, "Backend/src");
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".vite"]);
const JS_EXT = /\.(js|jsx|mjs|cjs)$/;

// Remove `// line` and `/* block */` comments from JS/JSX safely using
// Babel's token stream. Only tokens of type "CommentLine"/"CommentBlock"
// are dropped; strings, regexes, and template literals stay intact.
function stripJs(src) {
  let ast;
  try {
    ast = parse(src, {
      sourceType: "unambiguous",
      plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator", "objectRestSpread", "dynamicImport", "topLevelAwait"],
    });
  } catch {
    return { code: src, dropped: 0, error: "PARSE_FAILED" };
  }

  const ranges = (ast.comments || []).map((c) => [c.start, c.end]);
  if (ranges.length === 0) return { code: src, dropped: 0 };

  // Drop from last to first so positions stay valid.
  let out = src;
  let dropped = 0;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [start, end] = ranges[i];
    const slice = src.slice(start, end);
    const isLine = !slice.includes("\n");
    out = out.slice(0, start) + (isLine ? "" : "\n".repeat(slice.split("\n").length - 1)) + out.slice(end);
    dropped++;
  }
  return { code: out, dropped };
}

// Strip /* */ comments from CSS while preserving strings and url(...).
function stripCss(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let dropped = 0;

  while (i < n) {
    const ch = src[i];

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") j += 2;
        else if (src[j] === quote) { j++; break; }
        else j++;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }

    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) {
        out += src.slice(i);
        i = n;
        break;
      }
      const block = src.slice(i, end + 2);
      const newlines = block.split("\n").length - 1;
      out += "\n".repeat(newlines);
      i = end + 2;
      dropped++;
      continue;
    }

    out += ch;
    i++;
  }
  return { code: out, dropped };
}

// Remove comment-only lines and collapse 3+ blank lines to 2.
function tidy(src) {
  const lines = src.split("\n");
  const result = [];
  let blank = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      blank++;
      // Skip blank lines that are only leftover comment whitespace at EOF or
      // collapse runs of blank lines down to one.
      continue;
    }
    if (blank > 0 && result.length > 0) result.push("");
    result.push(line);
    blank = 0;
  }
  return result.join("\n");
}

function walk(dir, out, cssOut) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(p, out, cssOut);
    } else if (/\.css$/.test(entry.name)) {
      cssOut.push(p);
    } else if (JS_EXT.test(entry.name)) {
      out.push(p);
    }
  }
}

const files = [];
const cssFiles = [];
walk(FRONTEND, files, cssFiles);
walk(BACKEND, files, cssFiles);

let totalDropped = 0;
const changed = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const { code, dropped, error } = stripJs(src);
  if (error) {
    console.log("SKIP(parse) ", file);
    continue;
  }
  if (dropped === 0) continue;
  const cleaned = tidy(code);
  fs.writeFileSync(file, cleaned);
  totalDropped += dropped;
  changed.push(file);
}

for (const file of cssFiles) {
  const src = fs.readFileSync(file, "utf8");
  const { code, dropped } = stripCss(src);
  if (dropped === 0) continue;
  const cleaned = tidy(code);
  fs.writeFileSync(file, cleaned);
  totalDropped += dropped;
  changed.push(file);
}

console.log("Changed files:", changed.length);
for (const c of changed) console.log("  ", c);
console.log("Total comments removed:", totalDropped);
