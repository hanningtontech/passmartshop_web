# Complete Guide Prompt for Admin Web (Cursor)

**Use this as the opening prompt when working on the admin web in Cursor, so the AI distinguishes the admin from the user shop and follows the correct deployment flow.**

---

## Copy from here (prompt to paste into Cursor)

---

**Context – please treat this as the ADMIN web project and keep it clearly separate from the user shop.**

- **User shop (customer storefront):** The main Passmart shop runs at **passmart.com** (custom domain) and at https://passmartshop.web.app. It is built and deployed from the **`design/`** folder only. Do not overwrite or confuse it with the admin app.
- **This project is the ADMIN web app.** It must deploy to a **different** Firebase Hosting site so it never replaces the user shop. The admin site ID is **passmartshop-admin**.
- **Firebase project:** Both the shop and the admin use the same Firebase project **passmartshop**, but they use **two Hosting sites**: default site = user shop (passmart.com), second site = admin (passmartshop-admin).

**What link is used to run the admin?**
- **Default (works now):** **https://passmartshop-admin.web.app** — use this URL to open the admin app.
- **Optional custom domain (e.g. admin.passmart.com):** You can add a second domain in Firebase Console → Hosting → select site **passmartshop-admin** → Add custom domain, then add the A and TXT records at your registrar. After that, the admin will also be reachable at **admin.passmart.com** (or whatever subdomain you choose). Until then, use **https://passmartshop-admin.web.app**.

**When helping with this admin project, please:**

1. **Identity:** Always treat this codebase as the **admin web**. Do not suggest deploying from `design/` or changing the user storefront. References to “the shop” or “passmart.com” mean the user site; “the admin” or “admin web” mean this project.

2. **Firebase Hosting config:** In this admin app’s **firebase.json**, the hosting section **must** include:
   ```json
   "site": "passmartshop-admin"
   ```
   so that `firebase deploy --only hosting` from this project deploys **only** to the admin site and never to passmart.com / the default site.

3. **Build and deploy (admin only):**
   - Build: from this admin app root, run the app’s build command (e.g. `pnpm build` or `npm run build`; if the CLI can’t find the bundler, use `node node_modules/<bundler>/bin/...` from this folder).
   - Deploy: from this admin app root run `firebase deploy --only hosting`. That should deploy only to https://passmartshop-admin.web.app (and any custom domain you attach to the admin site).

4. **Custom domain for admin (optional):** If we add a custom domain (e.g. admin.passmart.com) for the admin site, use the Firebase Console → Hosting → passmartshop-admin site → Add custom domain, then add the A and TXT records Firebase shows at the domain registrar. Do not mix these with the records used for passmart.com (user shop).

5. **Firebase init (if starting from scratch here):** Use the same Firebase project **passmartshop**, set the **public directory** to this app’s build output (e.g. `dist` or `build`), configure as a single-page app if applicable, and ensure **firebase.json** includes `"site": "passmartshop-admin"` so this app is always distinguished from the user shop at passmart.com.

---

## Quick reference

| App        | Link to use (primary) | Also works                    | Deploy from        |
|------------|------------------------|-------------------------------|--------------------|
| **User shop** | **https://passmart.com** | https://passmartshop.web.app  | `design/`          |
| **Admin web** | **https://passmartshop-admin.web.app** (or **admin.passmart.com** if you add that custom domain) | passmartshop-admin.web.app | This admin app root |

---

*End of prompt. Paste the “Copy from here” block into Cursor when working on the admin web so the assistant keeps the admin and the shop (passmart.com) clearly distinguished.*
