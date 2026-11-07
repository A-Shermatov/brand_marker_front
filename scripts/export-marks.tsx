/**
 * Writes every mark as a standalone SVG file to public/icons/marks, from the
 * same components the site draws them with, so the files never drift.
 *
 *   npm run icons:export
 *
 * Each mark comes in two drawings: the large one (48 / 24 units) for cards and
 * headers, and the small one (20 units) that stays sharp at 16–24 px.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import { FreePlanMark, PlanMark } from "@/components/bm/plan-mark"
import { TrustMark } from "@/components/bm/trust-mark"

const OUT = join(process.cwd(), "public", "icons", "marks")
const BRAND_600 = "#0F7D58"

/** Longest prefix shared by all ids: the per-render React id. */
const sharedPrefix = (ids: string[]) =>
  ids.reduce((prefix, id) => {
    let i = 0
    while (i < prefix.length && prefix[i] === id[i]) i++
    return prefix.slice(0, i)
  })

/** Standalone file: namespace, readable ids unique to the file, no app classes. */
function standalone(markup: string, slug: string): string {
  let svg = markup.includes("xmlns=") ? markup : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!)
  if (ids.length) {
    const prefix = sharedPrefix(ids)
    if (prefix) svg = svg.split(prefix).join(`${slug}-`)
  }
  svg = svg.replace(/\s(class|data-size|data-tier|data-plan|data-glyph|data-part)="[^"]*"/g, "")
  return `${svg}\n`
}

const files: Record<string, React.ReactElement> = {}
for (const tier of ["none", "silver", "gold", "diamond"] as const) {
  files[`trust-${tier}`] = <TrustMark tier={tier} size={48} still />
  files[`trust-${tier}-small`] = <TrustMark tier={tier} size={20} still />
}
for (const plan of ["start", "pro", "business"] as const) {
  files[`plan-${plan}`] = <PlanMark plan={plan} size={48} still />
  files[`plan-${plan}-small`] = <PlanMark plan={plan} size={20} still />
}
files["plan-free"] = <FreePlanMark size={48} />
files["plan-free-small"] = <FreePlanMark size={20} />

mkdirSync(OUT, { recursive: true })
for (const old of readdirSync(OUT)) if (old.endsWith(".svg")) rmSync(join(OUT, old))

for (const [slug, node] of Object.entries(files)) {
  writeFileSync(join(OUT, `${slug}.svg`), standalone(renderToStaticMarkup(node), slug))
}
const seal = renderToStaticMarkup(<SealCheckIcon weight="fill" size={20} />).replace(/currentColor/g, BRAND_600)
writeFileSync(join(OUT, "verified.svg"), standalone(seal, "verified"))

console.log(`Wrote ${Object.keys(files).length + 1} files to ${OUT}`)
