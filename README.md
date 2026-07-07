This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cloudflare Runtime Services

This app uses Cloudflare services for background jobs, vector search, and KV-backed helpers:

- Cloudflare Queues dispatch Dropbox file processing and document OCR/embedding jobs.
- Cloudflare Vectorize stores OpenAI `text-embedding-3-small` document chunks. Create the index with 1536 dimensions and cosine distance.
- Cloudflare KV backs server-side rate limit/audit helpers.

Required app environment variables are listed in `.env.example`. The queue Worker lives in `cloudflare/workers/dms-jobs/worker.js` and is configured by `wrangler.toml`.

Production setup:

```bash
wrangler queues create dms-jobs
wrangler kv namespace create DMS_KV
wrangler vectorize create dms-documents --dimensions=1536 --metric=cosine
wrangler vectorize create-metadata-index dms-documents --property-name=resourceId --type=string
wrangler secret put QUEUE_WORKER_SECRET
wrangler secret put INTERNAL_JOB_SECRET
wrangler secret put APP_URL
wrangler deploy
```

Use the deployed Worker URL as `CLOUDFLARE_QUEUE_WORKER_URL` in the Next app. Set `CLOUDFLARE_QUEUE_WORKER_SECRET` to the same value as the Worker `QUEUE_WORKER_SECRET`, and set `INTERNAL_JOB_SECRET` in both the Worker and app to the same independent secret.
