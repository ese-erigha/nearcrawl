import { X } from '@phosphor-icons/react'
import { useState } from 'react'

import { COUNTRY_CHOICES, COUNTRY_PICK_CAP, type CountryChoice } from './country-choices.ts'

type HotCountryControlProps = {
  countries: CountryChoice[]
  onAdd: (code: string) => void
  onRemove: (code: string) => void
}

export function HotCountryControl({ countries, onAdd, onRemove }: HotCountryControlProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const atCap = countries.length >= COUNTRY_PICK_CAP
  const selected = new Set(countries.map((country) => country.code))
  const needle = query.trim().toLowerCase()
  const choices = COUNTRY_CHOICES.filter((country) => {
    if (selected.has(country.code)) return false
    if (needle.length === 0) return true
    return country.name.toLowerCase().includes(needle) || country.code.toLowerCase().includes(needle)
  })

  const add = (code: string) => {
    onAdd(code)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="mt-3">
      {countries.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {countries.map((country) => (
            <span key={country.code} className="inline-flex items-center gap-1 rounded-full border border-white/15 py-1 pr-1 pl-2.5 text-[13px] text-ink">
              {country.name}
              <button
                type="button"
                aria-label={`Remove ${country.name}`}
                onClick={() => onRemove(country.code)}
                className="flex size-5 items-center justify-center rounded-full text-ink-4 hover:bg-white/10 hover:text-ink"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <input
          value={query}
          aria-label="Add a country"
          aria-expanded={open}
          placeholder="Add a country"
          disabled={atCap}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          className="w-full rounded-full border border-white/15 bg-black px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink-4 disabled:opacity-40"
        />
        {open && !atCap ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-white/10 bg-space p-1">
            {choices.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(country.code)}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-white/5 hover:text-ink"
                >
                  {country.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
