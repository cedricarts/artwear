# ArtWear

Dark-mode streetwear e-commerce platform. React (Vite) + Firebase (Firestore, Auth) + Cloudinary.

## Setup

1. Install dependencies: `npm install`

2. Fill in Firebase config in `src/firebase/firebase.js` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

3. Fill in Cloudinary details in `src/hooks/useCloudinaryUpload.js` and `src/config/garments.js` (CLOUD_NAME, UPLOAD_PRESET — preset must be unsigned)

4. Publish Firestore security rules via Firebase Console → Firestore Database → Rules

5. Create your first admin account:
   - Sign in through the app once (creates your user doc with role: "customer")
   - In Firestore → users collection, find your doc, change role to "admin"
   - Sign out and back in

6. Run: `npm run dev`

## Firestore composite indexes required

Firestore will show a direct link to create these automatically the first time each query runs:
- orders where uid == + orderBy createdAt desc (order history)
- orders where deleted != true + orderBy deleted + orderBy createdAt desc (admin orders)
- orders where deleted == true + orderBy deletedAt desc (admin bin)
- products where tags array-contains-any + where soldOut != true (related products)
- designRequests orderBy createdAt desc
- users orderBy createdAt desc

## Project structure

```
src/
├── firebase/     Firebase app initialisation
├── context/      React Context providers
├── hooks/        Custom hooks + Firestore logic
├── utils/        Currency, variants, order/PDF/WhatsApp helpers
├── config/       Garment config for custom design builder
├── components/   Reusable UI components
├── pages/        Route-level pages
│   └── admin/    Admin dashboard, products, design requests, analytics
└── styles/       CSS Modules
    └── admin/    Admin stylesheets
```

## Key features

- Product variants (size x colour) with per-combination stock
- Multi-image galleries (2-7 images)
- Custom one-of-one design requests with live SVG preview
- Limited editions with automatic sold-out flipping
- Coupon codes
- Order management: status tracking, soft-delete bin, PDF export, WhatsApp contact
- Saved addresses, cancellation, tracking numbers
- Wishlist, reviews, related products
- Admin analytics (revenue chart, top products, low stock alerts)
- Fully responsive with mobile hamburger nav

## Placeholders to replace before production

- Firebase config values in `src/firebase/firebase.js`
- Cloudinary CLOUD_NAME/UPLOAD_PRESET in `src/hooks/useCloudinaryUpload.js`
- Cloudinary CLOUD_NAME in `src/config/garments.js` (swap placeholder colour-block generation for real garment photos once shot)
