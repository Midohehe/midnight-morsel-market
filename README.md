# Midnight Morsel Market

Build a complete mobile-first food delivery app called "NIGHTBITE" - Late Night Home Kitchen Delivery.



**BRAND:**

- Name: NIGHTBITE (EN) / نايت بايت (AR)

- Tagline EN: "Home Food, Late Night"

- Tagline AR: "أكل حوش، في نص الليل"

- Colors: Dark background #0F0F0F, Primary Orange #FF6B00 (food), Secondary Yellow #FFC700

- Logo: 🌙 + 🥪 emoji or text "NIGHTBITE" with moon icon

- Font: Tajawal for AR, Inter for EN



**CORE CONCEPT:**

Only open from 10 PM to 5 AM. Real homes (not restaurants) cook late night sandwiches, shakshuka, brik, etc. Customers nearby order. Delivery by moto boys.



**BILINGUAL SYSTEM (AR/EN):**

- Top toggle: 🇱🇾 AR | 🇬🇧 EN - switches dir rtl/ltr instantly

- i18n:

  ar: { appName: "نايت بايت", openNow: "فاتح توا", closed: "مسكر", nearbyHomes: "حياش قريبة منك", orderNow: "أطلب توا", cart: "السلة", myOrders: "طلباتي", beCook: "ولي طياب", homeFood: "أكل حوش", price: "السعر", delivery: "التوصيل", available: "متوفر", soldOut: "تم", addToCart: "ضيف للسلة", total: "المجموع", checkout: "أكد الطلب", rating: "التقييم" }

  en: { appName: "NIGHTBITE", openNow: "Open Now", closed: "Closed", nearbyHomes: "Homes Near You", orderNow: "Order Now", cart: "Cart", myOrders: "My Orders", beCook: "Become a Cook", homeFood: "Home Food", price: "Price", delivery: "Delivery", available: "Available", soldOut: "Sold Out", addToCart: "Add to Cart", total: "Total", checkout: "Checkout", rating: "Rating" }



**DATABASE (localStorage):**

- cooks: id, name, phone, avatar, kitchen_name_ar, kitchen_name_en, address, lat, lng, rating, total_orders, is_open (boolean), kitchen_video_url, is_verified

- products: id, cook_id, name_ar, name_en, description_ar, description_en, price_LYD, image_url, quantity_available, category (sandwich, shakshuka, brik, etc.)

- orders: id, customer_name, customer_phone, customer_address, cook_id, items [{product_id, qty, price}], total, delivery_fee, status (pending, cooking, on_way, delivered), created_at, delivery_boy

- users: id, name, phone, role (CUSTOMER, COOK, DELIVERY, ADMIN), avatar

- reviews: id, cook_id, order_id, rating, comment



**FEATURES - CUSTOMER APP (Main):**



1.  **Home Page:**

        - Top: Time indicator "Open 10 PM - 5 AM" + countdown to close + AR/EN toggle

        - Map view (fake map with pins): Show nearby open homes with distance "0.8 km away"

        - List view: Cards of open home kitchens:

            - Kitchen name, Cook name + avatar, Rating stars, Distance, Open/Closed badge (green/red)

            - Preview of 3 products with prices

            - Button: View Menu

        - Filter: "Open Now Only" toggle (default ON), Category filter (Sandwiches, Shakshuka, etc.)

        - If closed (daytime): Show big message "We open at 10 PM - نرجعو الساعة 10 في الليل" + countdown



2.  **Kitchen Menu Page:**

        - Kitchen header: Name, Rating, Total Orders, Address, Kitchen video/photo

        - Verification badge: "Verified Kitchen - مطبخ موثوق"

        - Product list: Image, Name AR/EN based on lang, Description, Price LYD, Available quantity, Add to Cart button

        - If quantity 0: Show Sold Out gray

        - Floating Cart button with total



3.  **Cart & Checkout:**

        - Items list with qty +/-

        - Summary: Food total + Delivery 5 LYD + App fee 2 LYD = Total

        - Fields: Your Name, Phone, Address (with "Use my location")

        - Payment: Cash on Delivery (for now)

        - Button: Confirm Order - creates order with status pending



4.  **My Orders:**

        - List of orders with status tracker: Pending -> Cooking -> On the way (with delivery boy name + phone) -> Delivered

        - After delivered: Rate the kitchen 1-5 stars + comment



**FEATURES - COOK APP (/cook):**



1.  Login as cook (phone + OTP 1234)

2.  Dashboard:

        - Toggle: Open/Closed (is_open)

        - Today's earnings, Today's orders

        - Incoming orders: New orders pop up with sound + Accept/Reject

        - When accept: Status changes to cooking, customer sees it

3.  My Menu: Add/Edit/Delete products

        - Form: Name AR, Name EN, Price, Quantity Available (update live), Photo upload (mock), Category

4.  Order History



**FEATURES - ADMIN PANEL (/admin) - login admin/admin123:**



1.  Dashboard: Total orders tonight, total revenue, active kitchens, active delivery boys

2.  Kitchens: Table - Verify kitchen (approve after watching video), Ban kitchen if rating < 3.5, View kitchen video

3.  Orders: Live view of all orders tonight with status

4.  Users: All customers/cooks/delivery boys

5.  Finance: Total commission (20% per order)



**FEATURES - DELIVERY BOY APP (/delivery):**



1.  Login

2.  Available orders: Orders ready for delivery near him

3.  Accept order -> Status becomes on_way

4.  Button: Delivered



**DESIGN:**

- Mobile only, max-width 430px, dark mode with orange accents (food delivery style like HungerStation)

- When AR: RTL, when EN: LTR

- Use real food images from Unsplash for mock products

- Make it feel warm, home-style, not corporate restaurant



**MOCK DATA (Tripoli):**

- 4 Cooks:

    1. Umm Fatima - السياحية - Sandwich Tuna Cheese - 8 LYD - Rating 4.8 - Open

    2. Khala Salma - قرجي - Shakshuka + Brik - 12 LYD - Rating 4.9 - Open

    3. Dar Bouzid - بن عاشور - Mlewi + Maklouba - 10 LYD - Rating 4.6 - Closed

    4. HouSh Tripoli - حي الأندلس - All sandwiches - 7 LYD - Rating 5.0 - Open

- Each has 3-4 products with images

- 2 pending orders for demo



Build full functional MVP with localStorage, all roles working, cart working, order flow working, no backend needed. Make it feel like a real late-night food app.

مع عمل كل متجر وسائق وزبون  وامن كل واحد له لوحة تحكم خاصة به ويوزر وباسورد

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://midnight-morsel-market.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e24fa586-1d98-4569-a092-91ea7000da28).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
