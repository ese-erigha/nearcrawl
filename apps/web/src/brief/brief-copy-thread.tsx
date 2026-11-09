import { Check, Copy } from '@phosphor-icons/react'
import { useState } from 'react'

import { BRIEF_SECONDARY } from './brief-styles.ts'

type BriefCopyThreadProps = {
  posts: string[]
}

export function BriefCopyThread({ posts }: BriefCopyThreadProps) {
  const [label, setLabel] = useState('Copy as a thread')
  const copied = label === 'Copied'

  async function copyThread() {
    const wrote = await writeClipboard(posts.join('\n\n'))
    setLabel(wrote ? 'Copied' : 'Copy failed')
    window.setTimeout(() => setLabel('Copy as a thread'), 1800)
  }

  return (
    <button type="button" className={BRIEF_SECONDARY} onClick={() => void copyThread()}>
      {copied ? <Check className="size-3.5 text-live" /> : <Copy className="size-3.5" />}
      {label}
    </button>
  )
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
