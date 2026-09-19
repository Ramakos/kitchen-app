# Ramakos Kitchen Display System (KDS)

> **Live Kitchen Ticket & Preparation Display** for **Ramakos Catering Service** (Kumasi Branch).  
> *"good food, good taste"* — Phone: `+233 32 249 6812`

---

## 1. Overview

**Ramakos Kitchen Display System (KDS)** is the frontline kitchen display interface designed for chefs and kitchen preparation teams at Ramakos. It provides a real-time card grid of active kitchen tickets routed from Counter POS, Worker floor apps, and customer Express Orders.

---

## 2. Key Features

- **Live Ticket Routing**: Instant ticket creation via Supabase PostgreSQL realtime subscriptions.
- **Urgency Visual Indicators**: Dynamic ticket border and badge shifts:
  - Normal (Fresh order)
  - Caution (> 5 minutes pending)
  - Urgent (> 10 minutes pending with visual pulse cues)
- **Item Level Bumping**: Bump individual dishes or entire tickets as *Cooking*, *Ready*, and *Collected*.
- **Station Filtering**: Filter incoming orders by kitchen prep station.

---

## 3. Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) Realtime
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 4. Local Development

```bash
# 1. Navigate to directory
cd "Kitchen app"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
