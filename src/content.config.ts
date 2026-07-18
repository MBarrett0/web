import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    sector: z.string(),
    summary: z.string(),
    results: z.array(z.string()),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({ question: z.string(), order: z.number() }),
});

export const collections = { cases, faq };
