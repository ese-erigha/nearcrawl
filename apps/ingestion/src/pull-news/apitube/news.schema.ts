import { z } from 'zod'

const IPTC_MEDIATOPICS = 'iptc_mediatopics'

export const nullableText = z.string().trim().min(1).nullable().catch(null)
const nullableInt = z.int().nullable().catch(null)
const nullableNumber = z.number().nullable().catch(null)
const nullableFlag = z.boolean().nullable().catch(null)
const idText = z.union([z.number().transform(String), z.string().trim().min(1)])

export const countryCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase())
  .nullable()
  .catch(null)

export const placePoint = z.object({ lat: z.number(), lng: z.number() })

export const articleSchema = z.object({
  id: idText,
  title: z.string().trim().min(1),
  href: z.string().trim().min(1),
  published_at: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
  description: nullableText,
  body: nullableText,
  body_html: nullableText,
  image: nullableText,
  is_breaking: z.boolean().catch(false),
  is_free: nullableFlag,
  is_duplicate: z.boolean().catch(false),
  read_time: nullableInt,
  words_count: nullableInt,
  author: z.object({ name: nullableText }).nullable().catch(null),
  story: z.object({ id: idText }).nullable().catch(null),
  shares: z.object({ total: nullableInt }).nullable().catch(null),
  source: z
    .object({
      domain: nullableText,
      favicon: nullableText,
      home_page_url: nullableText,
      location: z
        .object({
          country_name: nullableText,
          country_code: countryCode,
        })
        .nullable()
        .catch(null),
      rankings: z.object({ opr: nullableInt }).nullable().catch(null),
    })
    .nullable()
    .catch(null),
})

export const categorySchema = z.object({
  taxonomy: z.literal(IPTC_MEDIATOPICS),
  name: nullableText,
  parent: z.unknown().optional(),
  score: nullableNumber,
  links: z.object({ self: z.unknown() }).nullable().catch(null),
})

export const placeCountry = z.object({ country: z.unknown() }).nullable().catch(null)

export const unknownItems = z.array(z.unknown()).catch([])
