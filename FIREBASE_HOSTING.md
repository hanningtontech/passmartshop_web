# Firebase Hosting – Two Sites (User + Admin)

This project has **two Firebase Hosting sites** in the same project (`passmartshop`):

| Site ID              | Purpose        | Link to use                      | Deploy from      |
|----------------------|----------------|----------------------------------|------------------|
| **passmartshop**      | User storefront| **https://passmart.com** (and passmartshop.web.app) | `design/`        |
| **passmartshop-admin**| Admin app      | **https://passmartshop-admin.web.app** (optional: admin.passmart.com) | Admin app folder |

**Summary:** Users use **passmart.com**. Admins use **https://passmartshop-admin.web.app** (or **admin.passmart.com** if you add that custom domain).

---

## Deploy user storefront (design/)

From the **design** folder only:

```powershell
cd "design"
node node_modules/vite/bin/vite.js build
firebase deploy --only hosting
```

This deploys to **https://passmartshop.web.app** (no `site` in `design/firebase.json` = default site).

---

## Deploy admin app

From the **admin app root folder** (where the admin’s `firebase.json` and build output live):

1. **Required:** In the admin folder’s **firebase.json**, the hosting config must target the admin site so it does **not** overwrite the user site:

   ```json
   {
     "hosting": {
       "site": "passmartshop-admin",
       "public": "dist",
       "rewrites": [{ "source": "**", "destination": "/index.html" }]
     }
   }
   ```

2. Build the admin app, then deploy:

   ```powershell
   cd "<admin-app-folder>"
   pnpm build
   firebase deploy --only hosting
   ```

That deploys to **https://passmartshop-admin.web.app** only.

---

## Summary

- **User site:** Deploy only from `design/`. Do **not** put `"site": "passmartshop-admin"` in `design/firebase.json`.
- **Admin site:** Deploy only from the admin app folder. That folder’s `firebase.json` **must** include `"site": "passmartshop-admin"` so deploys go to the admin URL and never overwrite the user storefront.
