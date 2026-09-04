# ArtWear — Design pass (theme toggle, neumorphic 3D, admin-managed homepage)

This is your full project with the redesign applied directly — not
patch instructions this time. Drop this over your existing repo (or
diff it against git if you have local changes since the last export)
and it should run as-is.

## How to set banner/carousel images (already built — just needs finding)

1. Make sure your Firestore user doc has `role: "admin"` (set manually
   in the console if you haven't already — there's no self-serve admin
   promotion, by design).
2. Log in, go to `/admin/home-content` (also linked from every admin
   page's nav bar now).
3. **Banner**: check "Show on storefront", fill in the text fields —
   no image upload for the banner itself, it's text + a CTA button on
   a neumorphic panel, not an image background.
4. **Carousel**: click "+ Add Slide", then click "Upload" under the
   image thumbnail — this goes through your existing Cloudinary hook,
   same as product photos. Fill in title/subtitle/link, reorder with
   the ↑/↓ arrows, click "Save Changes".
5. **Featured (bento)**: same page, third panel — check up to 6
   products from the list. Order matters: first pick becomes the
   large tile, next two become wide tiles. This pulls product photos
   automatically — nothing to upload here.

Everything saves to a single `siteContent/home` Firestore doc and
updates the storefront live via `onSnapshot` — no redeploy needed
after the first deploy that includes this code.

## What changed since the last export

- **Theme toggle** — `ThemeContext` + `ThemeToggle`, dark/light tokens
  in `global.css`, persisted to localStorage, OS-preference default.
- **Product cards — substantially redesigned, not just re-shadowed.**
  Previous version kept the old flat card layout and only added a
  shadow, which is why it didn't look different. This version changes
  the actual silhouette:
  - Outer card is a raised neumorphic shell with visible padding
    around the image (image no longer touches the card edge)
  - The image itself sits in a **pressed/sunken inner well** — raised
    shell containing a sunken frame is the core neumorphic contrast,
    and it was completely absent before
  - The flat full-width "Add to Cart" bar is replaced with a circular
    floating action button overlapping the price row
  - Wishlist heart moved to a floating circle over the image, badges
    are floating pill chips instead of edge-to-edge banners
- **Bento section for featured/new products** — `/admin/home-content`
  lets you hand-pick up to 6 products; renders as a proper bento grid
  (1 large + 2 wide + rest standard) above the main product listing.
  This is intentionally separate from the main product grid — see the
  earlier note on why a dynamically filtered/sorted grid can't carry
  a stable "hero" tile.
- **Homepage banner + carousel** — compact, admin-managed, render
  nothing until configured.
- **The `slides is not defined` crash is fixed** at the source.
- **`vite.config.js`** — pinned CSS Modules' scoped class name format
  so production builds don't silently break the global button styling
  (see inline comment in the file for why).

## The one thing you still need to do yourself

**Add a Firestore rule for `siteContent/home`.** Your rules live in
the Firebase Console, not in this repo, so I can't add it for you.
Wherever your existing rules are, add:

```
match /siteContent/{docId} {
  allow read: if true;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

Match the admin-check line to whatever pattern your `products`/`orders`
rules already use — don't reinvent it. Until this is added, the admin
editor at `/admin/home-content` will fail to save (or, depending on
your existing catch-all rule, could be wide open — check which before
you deploy this).

## Still not done (from earlier in this conversation, not lost)

- Yoco Cloud Functions (`createYocoCheckout` / `yocoWebhook`) — separate
  deliverable from earlier, not bundled into this zip.
- The bento layout is now live for the **Featured** section only —
  the main product grid still deliberately does not use it, for the
  reason discussed earlier (no stable hero item in a dynamically
  filtered/sorted list).
- Cleanup job for orders stuck in `awaiting_payment`, and proper
  `payment.failed` handling in the webhook — both still open.
