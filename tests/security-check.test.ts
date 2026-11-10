import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { scanTree } from "../scripts/security-check.mjs"

/**
 * The build-time check against the loader that was force-pushed into this
 * repository. Every sample below is assembled from pieces, so this file
 * itself stays clean by the rules it tests.
 */

const made: string[] = []

afterEach(() => {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const CLEAN_PACKAGE = {
  name: "sample",
  scripts: {
    predev: "node scripts/security-check.mjs",
    dev: "next dev",
    build: "next build --webpack",
    start: "next start",
    "icons:export": "vite-node --config vitest.config.mts scripts/export-marks.tsx",
  },
}

const CLEAN_POSTCSS = ["const config = { plugins: {} };", "", "export default config;", ""].join("\n")

/** A small clean project, plus the given files (path -> content). */
function tree(files: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "bm-check-"))
  made.push(root)
  const all: Record<string, string> = {
    "package.json": JSON.stringify(CLEAN_PACKAGE, null, 2),
    "postcss.config.mjs": CLEAN_POSTCSS,
    ".gitignore": "node_modules\n.next/\n",
    Dockerfile: "FROM node:22-alpine\nRUN node scripts/security-check.mjs\n",
    ...files,
  }
  for (const [path, content] of Object.entries(all)) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
  return root
}

const withScripts = (scripts: Record<string, string>) =>
  JSON.stringify({ ...CLEAN_PACKAGE, scripts: { ...CLEAN_PACKAGE.scripts, ...scripts } })

const blanks = (count: number) => " ".repeat(count)
const found = (root: string) => scanTree(root).join("\n")

describe("security check: what must pass", () => {
  it("finds nothing in a clean project", () => {
    expect(scanTree(tree())).toEqual([])
  })

  it("finds nothing in this repository", () => {
    expect(scanTree()).toEqual([])
  })

  it("leaves ordinary things alone", () => {
    const root = tree({
      // A developer's own editor settings, without automatic tasks.
      ".vscode/settings.json": JSON.stringify({ "editor.formatOnSave": true }),
      ".vscode/extensions.json": JSON.stringify({ recommendations: ["esbenp.prettier-vscode"] }),
      // A spelling word list, as editors keep them.
      ".vscode/spellright.dict": ["Contentful", "Lerna", ""].join("\n"),
      // Static assets may be minified into one line.
      "public/vendor.js": `var a=${"1+".repeat(2500)}1;`,
      // Scripts that start processes live in their own folders.
      "e2e/stack/front.mjs": ['import { spawn } from "node:child_', 'process"', "\nspawn('next')\n"].join(""),
      LICENSE: "MIT",
    })
    expect(scanTree(root)).toEqual([])
  })
})

describe("security check: how the loader hides", () => {
  it("sees code pushed off-screen behind a run of blanks", () => {
    const root = tree({ "postcss.config.mjs": `export default config;${blanks(505)}void 0;\n` })
    expect(found(root)).toContain("Code hidden after a long run of blanks in postcss.config.mjs:1")
  })

  it("sees one very long line, in a config file or anywhere in the source", () => {
    const packed = `const x = "${"ab".repeat(1700)}";\n`
    const root = tree({ "tailwind.config.ts": packed, "components/ui/chip.tsx": packed })
    const all = found(root)
    expect(all).toMatch(/Very long line \(\d+ characters\) in tailwind\.config\.ts:1/)
    expect(all).toMatch(/Very long line \(\d+ characters\) in components\/ui\/chip\.tsx:1/)
  })

  it("sees code in a file without an extension, which scanners by extension skip", () => {
    const root = tree({ init: "const http = require('node:http');\n", "tools/run": "function go() {}\n" })
    const all = found(root)
    expect(all).toContain("Known dropper file present: init")
    expect(all).toContain("Code in a file without an extension: init")
    expect(all).toContain("Code in a file without an extension: tools/run")
  })

  it("sees an ignore list that hides itself or the loader's files", () => {
    const root = tree({ ".gitignore": "node_modules\n.gitignore\ntemp_auto_push.bat\napi.js\n" })
    const all = found(root)
    expect(all).toContain(".gitignore hides itself")
    expect(all).toContain(".gitignore hides a file the loader uses: temp_auto_push.bat")
    expect(all).toContain(".gitignore hides a file the loader uses: api.js")
  })
})

describe("security check: how the loader gets started", () => {
  it("sees a program chained into the dev, build and start scripts, with or without an extension", () => {
    const root = tree({
      "package.json": withScripts({ dev: "node init && next dev", build: "node api.js && next build", start: "node ./init; next start" }),
    })
    const all = found(root)
    expect(all).toContain('script "dev" starts an unexpected program: node init')
    expect(all).toContain('script "build" starts an unexpected program: node api.js')
    expect(all).toContain('script "start" starts an unexpected program: node init')
  })

  it("sees an install hook", () => {
    const root = tree({ "package.json": withScripts({ postinstall: "node scripts/setup.mjs" }) })
    expect(found(root)).toContain('install hook "postinstall"')
  })

  it("sees an editor task that runs when the folder is opened", () => {
    const root = tree({
      ".vscode/tasks.json": JSON.stringify({ tasks: [{ label: "x", runOptions: { runOn: "folderOpen" } }] }, null, 2),
      ".vscode/settings.json": JSON.stringify({ "task.allowAutomaticTasks": true }, null, 2),
      ".vscode/eslint": "void 0;\n",
      ".vscode/eslint-check.cmd": "@echo off\n",
    })
    const all = found(root)
    expect(all).toContain("Editor task that runs when the folder is opened: .vscode/tasks.json")
    expect(all).toContain("Editor setting that lets tasks run without asking: .vscode/settings.json")
    expect(all).toContain("Unexpected file in the editor folder: .vscode/eslint")
    expect(all).toContain("Unexpected file in the editor folder: .vscode/eslint-check.cmd")
  })
})

describe("security check: what the loader does", () => {
  it("sees text run as code and processes started from application code", () => {
    const root = tree({
      "lib/a.ts": ["export const run = (s: string) => ev", "al(s)\n"].join(""),
      "lib/b.ts": ["export const make = () => new Func", 'tion("return this")\n'].join(""),
      "lib/c.ts": ['import { spawn } from "node:child_', 'process"\n'].join(""),
    })
    const all = found(root)
    expect(all).toContain("Runs text as code in lib/a.ts")
    expect(all).toContain("Runs text as code in lib/b.ts")
    expect(all).toContain("Starts other programs outside scripts/, e2e/stack/: lib/c.ts")
  })

  it("knows the shapes of the versions seen so far", () => {
    const samples: Record<string, string> = {
      // Reads its server address from an Ethereum node.
      "lib/rpc.ts": ['const method = "eth_', 'getBlockByNumber"\n'].join(""),
      // The unpacking routine of its packed strings.
      "lib/unpack.ts": ["h += (j & 81", "91) > 88 ? 13 : 14\n"].join(""),
      // A hidden interactive Node fed through its input.
      "lib/spawn.ts": ['start("no', 'de", ["-i"], { detached: true })\n'].join(""),
      // The campaign tag and the header of the second stage.
      "lib/tag.ts": ["global", ".i = 'A10'\n"].join(""),
      "lib/head.ts": ['const h = res.headers["x-payload', '-b64"]\n'].join(""),
      "lib/path.ts": ['const u = host + ":443/0x', '/cls"\n'].join(""),
    }
    const all = found(tree(samples))
    for (const path of Object.keys(samples)) {
      expect(all, path).toContain(`in ${path}`)
    }
  })
})
