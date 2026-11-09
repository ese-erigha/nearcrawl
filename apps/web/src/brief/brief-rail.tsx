import { Export, GlobeHemisphereWest, LinkSimple, LinkedinLogo, XLogo } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PATH } from '../shell/navigation.constants.ts'
import type { BriefView } from './brief-model.ts'
import { BRIEF_CHIP, BRIEF_EYEBROW, BRIEF_PRIMARY, BRIEF_SECONDARY, BRIEF_TILE } from './brief-styles.ts'

type BriefRailProps = {
  brief: BriefView
}

export function BriefRail({ brief }: BriefRailProps) {
  return (
    <aside className="min-w-0 pt-12 lg:col-start-2 lg:row-start-3" aria-label="Follow the brief">
      <div className="space-y-3 lg:sticky lg:top-6">
        <MorningCard note={brief.morningNote} />
        <ShareCard title={brief.shareTitle} text={brief.shareText} />
      </div>
    </aside>
  )
}

function MorningCard({ note }: { note: string }) {
  const [label, setLabel] = useState('Copy link')

  async function copyLink() {
    const wrote = await writeClipboard(window.location.href)
    setLabel(wrote ? 'Copied' : 'Copy failed')
    window.setTimeout(() => setLabel('Copy link'), 1800)
  }

  return (
    <section className={`${BRIEF_TILE} p-4`}>
      <h2 className={BRIEF_EYEBROW}>Get this every morning</h2>
      <p className="mt-2 text-[13.5px] leading-snug text-pretty text-ink-2">
        {note}
      </p>
      <div className="mt-4 grid gap-2">
        <button type="button" className={`${BRIEF_PRIMARY} w-full`} onClick={() => void copyLink()}>
          <LinkSimple className="size-3.5" /> {label}
        </button>
        <Link to={PATH.MAP} className={`${BRIEF_SECONDARY} w-full`}>
          <GlobeHemisphereWest className="size-3.5" /> Open the live map
        </Link>
      </div>
    </section>
  )
}

function ShareCard({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? '' : window.location.href
  const button = `${BRIEF_CHIP} h-8 justify-center`

  async function copyLink() {
    const wrote = await writeClipboard(window.location.href)
    setCopied(wrote)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function shareMore() {
    if (typeof navigator.share !== 'function') {
      await copyLink()
      return
    }
    try {
      await navigator.share({ title, text, url: window.location.href })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setCopied(false)
    }
  }

  return (
    <section className={`${BRIEF_TILE} p-4`}>
      <h2 className={BRIEF_EYEBROW}>Share today&apos;s brief</h2>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <button type="button" className={button} onClick={() => void copyLink()}>
          <LinkSimple className="size-3.5" /> {copied ? 'Copied' : 'Copy link'}
        </button>
        <a href={postHref(text, url)} target="_blank" rel="noreferrer" aria-label="Post on X" className={button}>
          <XLogo className="size-3.5" /> Post
        </a>
        <a href={linkedinHref(url)} target="_blank" rel="noreferrer" className={button}>
          <LinkedinLogo className="size-3.5" /> LinkedIn
        </a>
        <button type="button" className={button} onClick={() => void shareMore()}>
          <Export className="size-3.5" /> More
        </button>
      </div>
    </section>
  )
}

function postHref(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

function linkedinHref(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
