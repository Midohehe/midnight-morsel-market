# Moving NIGHTBITE data to the real database (step by step)

Right now everything lives in each person's browser. After this, every phone sees the same kitchens, orders, wallets and cards.

## Step 1 — Real accounts
- Each person signs up with username + password (stored as real accounts, not in the browser).
- Role chosen at signup: customer (default), cook, driver. Admin is assigned only by the system, never chosen.
- Demo accounts (admin, fatima, salma, bouzid, housh, ali, omar, ahmed) recreated with the same passwords.
- Cook phone + OTP 1234 stays as a demo shortcut.

## Step 2 — Kitchens and menu
- Kitchens (name, area, cover, open/closed, verified, rating, location) and meals (names AR/EN, price, photo, quantity, available) saved in the database.
- Kitchen covers and meal photos uploaded to real image storage.
- Anyone can browse; only the owner cook edits their kitchen; admin can verify/ban.

## Step 3 — Orders and reviews
- Orders created by customers, seen by their cook, available orders seen by drivers, all seen by admin.
- Status flow unchanged: pending, cooking, ready, on the way, delivered. Ratings update the kitchen average.
- Cooks get new orders live (with the sound) without refreshing.

## Step 4 — Wallets and top-up cards
- Balances and transaction history in the database; money moves only through safe server-side actions (pay, refund on reject, pay cook 80% and driver 5 LYD on delivery).
- Admin issues cards of any value; redeeming a card works once only. Excel export unchanged.

## Step 5 — Clean up
- Remove the browser-only storage (cart and language stay in the browser).
- Test the full flow: order, accept, deliver, rate, wallet payment, card top-up.

Each step is finished and tested before the next, so the app keeps working throughout.

## Technical details
- Tables: profiles, user_roles (app_role enum + has_role), cooks, products, orders, order_items (jsonb items acceptable), reviews, wallets, transactions, topup_cards; GRANTs + RLS on all.
- Username login mapped to a synthetic email (username@nightbite.local) with auto-confirm enabled for this flow.
- Wallet moves, card redemption, settlement and refunds as SECURITY DEFINER SQL functions (atomic, balance checks).
- Storage bucket for covers and meal images (public read, owner write).
- Reads via TanStack Query; realtime subscription on orders for cooks/drivers.
