# Backblaze B2 Hosting – Use B2 in Production (Not Locally)

This guide explains how to use Backblaze B2 as your **hosted** media storage so the app (passmart.com and admin) uses B2 from the cloud instead of depending on anything running locally.

---

## 1. What “hosting B2” means here

- **B2 bucket** stays on Backblaze (it’s already “in the cloud”).
- **You** stop relying on local runs for uploads or for the app to see B2 files.
- **Result:** The live site (passmart.com) and any deployed backend use B2 via public URLs and/or env vars set in production.

---

## 2. Make the B2 bucket public (so the app can load images)

Your app expects image URLs like:

`https://f005.backblazeb2.com/file/your-bucket-name/products/123/abc.jpg`

For that to work from the deployed site:

1. In **Backblaze B2 Console** → **Buckets** → your bucket (e.g. `passmartshop-media`).
2. Set the bucket to **Public** (or create a **Bucket Policy** that allows public read for the object prefix you use for product/category images).
3. Note the **base URL** for the bucket, e.g.  
   `https://f005.backblazeb2.com/file/passmartshop-media`  
   (format: `https://<pod>.backblazeb2.com/file/<bucket-name>`).

Once the bucket is public, any image URL you store in Firestore/DB that points to this base + path will work from passmart.com with no local B2 process.

---

## 3. Where the app gets B2 URLs

| Use | Where it’s set | Purpose |
|-----|----------------|--------|
| **Seed script** (products/categories) | Env var `B2_BASE_URL` | Base URL when generating image URLs for seed data (e.g. `https://f005.backblazeb2.com/file/passmartshop-media`). |
| **Frontend (low-quality images)** | Build-time env `VITE_LOW_QUALITY_IMAGE_BASE` | Optional; base URL for a second B2 bucket (or path) used for small image versions. |
| **Backend (Forge storage proxy)** | `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY` | Your server uses Forge to upload; Forge can store to B2. No B2 keys needed in this app if Forge handles B2. |

So “hosting B2” for the app = **bucket is public** + **correct base URL(s) used in production**.

---

## 4. Set production env vars (so nothing depends on “local” B2)

### A. When you build the frontend (e.g. for Firebase Hosting)

Set at build time so the deployed bundle has the right B2 base:

- **Optional:** `VITE_LOW_QUALITY_IMAGE_BASE` = your low-quality B2 base, e.g.  
  `https://f005.backblazeb2.com/file/passmartshop-media-low`

If you don’t use a separate low-quality bucket, you can leave this unset.

### B. When you run the backend (Node/Express) in production

Deploy the backend (e.g. **Google Cloud Run**, Railway, or a VPS) and set **server** env vars there (not only on your laptop):

- `BUILT_IN_FORGE_API_URL` – Forge API base (used for storage, maps, etc.).
- `BUILT_IN_FORGE_API_KEY` – Forge API key.
- `B2_BASE_URL` – only if the backend generates B2 URLs (e.g. seed or internal APIs). Use your **public** B2 base, e.g.  
  `https://f005.backblazeb2.com/file/passmartshop-media`
- `DATABASE_URL`, `JWT_SECRET`, etc. – as already required.

Then the backend uses B2 (via Forge and/or B2_BASE_URL) from the cloud, not from your machine.

### C. When you run the seed script (one-time or occasional)

Run the script in an environment that has `B2_BASE_URL` set to your **public** B2 base URL (same as above). That way generated product/category image URLs point at B2 and work on passmart.com.

---

## 5. Optional: Custom domain for B2 (e.g. media.passmart.com)

B2 doesn’t natively offer custom domains on the bucket URL. You can put a **CDN** in front and use your domain:

- **Cloudflare** (or another CDN): Create a CNAME (e.g. `media.passmart.com`) that points to your B2 bucket’s public URL (or to a B2 “Friendly URL” if you use one). Then:
  - Use `https://media.passmart.com` as the base instead of `https://f005.backblazeb2.com/file/passmartshop-media` in `B2_BASE_URL` and (if used) `VITE_LOW_QUALITY_IMAGE_BASE`.
- **Backblaze “Friendly URL”**: If you use B2’s custom domain feature (where offered), use that base URL in the env vars above.

After that, the app “hosts” media on B2 and serves it under your domain; no local B2 process is involved.

---

## 6. Checklist – “B2 hosted, not local”

- [ ] B2 bucket is **public** (or has a read policy for your object prefix).
- [ ] You have the **base URL** (e.g. `https://f005.backblazeb2.com/file/passmartshop-media`).
- [ ] **Frontend build** for passmart.com uses the right env (e.g. `VITE_LOW_QUALITY_IMAGE_BASE` if you use it).
- [ ] **Backend** (when deployed) has `BUILT_IN_FORGE_*` and, if needed, `B2_BASE_URL` set in the **host’s** env (e.g. Cloud Run, Railway), not only in local `.env`.
- [ ] **Seed script** is run with `B2_BASE_URL` set to that same public base so stored URLs point at B2.
- [ ] (Optional) **Custom domain** for media (e.g. media.passmart.com) via CDN and then use that as the base in the vars above.

Once this is done, the app uses Backblaze B2 entirely from the cloud; you can stop relying on local B2 usage for production.
