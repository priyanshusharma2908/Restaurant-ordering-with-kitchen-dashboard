# TableTalk

TableTalk is a QR-first restaurant ordering demo for a first-year B.Tech GenAI assignment. Guests browse an Indian restaurant menu, place an order from their table, ask an AI concierge for dish suggestions, and track kitchen progress live. Staff use a PIN-protected kitchen dashboard.

## Screenshots

_Add screenshots here after running the app._

## Features

1. **Table QR menu** — printable and downloadable PNG QR codes for tables 1–100; menu search, category filters, dish photos, prices, and dietary labels.
2. **Order placement** — shared cart, quantities, kitchen notes, server-side price calculation, Supabase order and item persistence, confirmation, and order ID.
3. **Kitchen dashboard** — PIN-protected Pending → Preparing → Ready → Served board, elapsed time, overdue highlighting, realtime order changes, and a new-order sound.
4. **Live order status** — a guest-facing progress tracker subscribes to Supabase Realtime and updates without a refresh.
5. **AI Chef’s Concierge** — Groq asks about diet, spice, occasion/appetite, and budget, then recommends only dishes from the live Supabase menu.
6. **Role status** — choose a customer profile or verify an employee profile using the kitchen PIN, with the employee’s restaurant name shown in the header and kitchen board.

## Tech stack

- Next.js 14 App Router, JavaScript, Tailwind CSS
- Supabase Postgres and Realtime
- Groq `llama-3.3-70b-versatile` through server API routes
- `qrcode` for table QR PNGs
- Vercel deployment

## Local setup

1. Install Node.js 18.17+ and run `npm install`.
2. Create a Supabase project. In its SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in the values below. Get the project URL and anon key from Supabase Project Settings → API. Keep the service role key private. Get a Groq API key from [console.groq.com/keys](https://console.groq.com/keys).
4. Run `npm run dev` and visit `http://localhost:3000`.

| Variable | Description |
| --- | --- |
| `GROQ_API_KEY` | Server-only Groq API key for the concierge |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key (RLS limits its access to menu and minimal status feed) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key for API routes |
| `KITCHEN_PIN` | Staff PIN, verified by the server |
| `NEXT_PUBLIC_SITE_URL` | App base URL, e.g. `http://localhost:3000` |

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Add the six environment variables above in Project Settings → Environment Variables.
3. Run the schema and seed SQL in the production Supabase project.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS URL, redeploy, and print the table QR codes at `/admin/qr`.

## How to demo

1. Open `/admin/qr`, print Table 1’s QR, or open `/menu?table=1` directly.
2. Add dishes, include an optional kitchen note, and place the order. Save its tracking link.
3. Open `/kitchen`, enter the `KITCHEN_PIN`, and move the order through the columns. The guest tracking page updates live.
4. On the menu, open “Ask the chef” and share dietary preferences. The concierge suggests matching real menu items that can be added to the same cart.

## Notes and limitations

- Realtime diner subscriptions use a minimal `order_status_feed` table so order notes and kitchen details are not publicly readable. The SQL script also enables the `orders` table in the Supabase Realtime publication as requested.
- The kitchen board also refreshes every 15 seconds if a Realtime connection is temporarily unavailable.
- The concierge rate limiter is in-memory and per server instance; use a shared store for strict global limits on a multi-instance deployment.
- Employee profiles are verified with the shared `KITCHEN_PIN`, and the restaurant name is a local profile label. This single-restaurant assignment demo does not provide individual employee accounts or tenant-level restaurant data separation.
- Dish photos are loaded from Unsplash image URLs and require an internet connection.
- Configure Supabase and Groq credentials before using order storage and the concierge. No order or chat data is copied to a separate application database.
