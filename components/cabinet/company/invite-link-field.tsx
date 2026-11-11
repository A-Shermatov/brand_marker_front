"use client"

import { useState } from "react"
import { CheckIcon as Check, CopyIcon as Copy } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** The invitation link with a "copy" button, to hand over in a messenger. */
export const InviteLinkField = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard access: the link stays selectable in the field.
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={url}
        aria-label="Ссылка-приглашение"
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 text-[13.5px]"
      />
      <Button type="button" variant="outline" onClick={() => void copy()} className="shrink-0">
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Скопировано" : "Скопировать"}
      </Button>
    </div>
  )
}
