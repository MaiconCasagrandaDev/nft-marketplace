import { z } from "zod"

const text = z.union([z.string(), z.number()]).transform(String)
const decimal = text.refine((v) => /^\d+(\.\d+)?$/.test(v))

export const catalogSearchSchema = z.object({
  q: text.optional().catch(undefined),
  category: z
    .enum([
      "arte-digital", "fotografia", "musica", "arte-3d", "colecionaveis",
      "generativa", "jogos", "assinaturas", "utilidade",
    ])
    .optional()
    .catch(undefined),
  network: z.enum(["ethereum", "polygon", "solana"]).optional().catch(undefined),
  minPrice: decimal.optional().catch(undefined),
  maxPrice: decimal.optional().catch(undefined),
  sort: z.enum(["recent", "price-asc", "price-desc"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>