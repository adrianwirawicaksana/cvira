# CVira — Generative CV Generator

CV profesional dalam detik, didukung oleh AI.

---

## 🚀 Getting Started

Ikuti langkah berikut untuk menjalankan project di lokal.

### Prerequisites

Pastikan kamu sudah menginstall:

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- [Vercel CLI](https://vercel.com/docs/cli) (untuk menjalankan serverless functions di lokal)

---

### 1. Clone Repository

```bash
git clone https://github.com/adrianwirawicaksana/cvira.git
cd cvira
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` lalu rename menjadi `.env`.

```bash
cp .env.example .env
```

Kemudian isi value sesuai konfigurasi API kamu:

```env
# GEMINI API
GEMINI_KEY_1=your_gemini_api_key
GEMINI_KEY_2=your_gemini_api_key
GEMINI_KEY_3=your_gemini_api_key

# MAYAR
MAYAR_API_KEY=your_mayar_api_key
MAYAR_PRODUCT_ID=your_product_id
MAYAR_TIER_ID=your_tier_id
MAYAR_PRO_LINK=https://your-checkout-link

# APP
APP_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
PORT=3000

# FREE LIMIT
FREE_DAILY_LIMIT=3

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Run Project Locally

```bash
vercel dev
```

Aplikasi akan berjalan di:

```
http://localhost:3000
```

> **Catatan:** Gunakan `vercel dev` bukan membuka file HTML langsung, karena project ini menggunakan serverless functions yang hanya bisa berjalan melalui Vercel CLI.

---

## ☁️ Deployment

Project ini menggunakan **Serverless Functions di Vercel** — tidak ada backend tradisional.

### Deploy ke Vercel

1. Install Vercel CLI

```bash
npm i -g vercel
```

2. Login ke Vercel

```bash
vercel login
```

3. Deploy project

```bash
vercel
```

> Pastikan **Environment Variables** sudah diset di [Vercel Dashboard](https://vercel.com/dashboard) sebelum deployment.

---

## 📁 Project Structure

```
cvira/
│
├── src/                        # Frontend static files
│   ├── index.html              # Single page application
│   ├── global.css              # Global styles & animations
│   └── main.js                 # Client-side logic & CV generator
│
├── api/                        # Serverless functions (Vercel)
│   ├── generate.js             # CV generation via Gemini AI
│   ├── config.js               # App config & payment link
│   ├── status.js               # API health check
│   └── auth/
│       ├── google.js           # Google OAuth — init login
│       ├── callback.js         # Google OAuth — handle callback
│       ├── logout.js           # Session logout
│       └── me.js               # Get current user session
│
├── lib/                        # Shared utilities
│   └── ...                     # Helper functions, DB, session, etc.
│
├── .env.example                # Environment variables template
├── vercel.json                 # Vercel routing & build config
├── package.json                # Dependencies & scripts
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Serverless | Node.js (Vercel Functions) |
| AI | Google Gemini API |
| Auth | Google OAuth 2.0 |
| Payment | Mayar.id |
| Deployment | Vercel |

---

## 💳 Sponsorship & Payment Partner

Project ini didukung oleh **[Mayar.id](https://mayar.id)** sebagai payment gateway resmi untuk sistem membership CVira.

[![Mayar.id](https://img.shields.io/badge/Payment%20Partner-Mayar.id-ec4899?style=for-the-badge)](https://mayar.id)

Mayar.id menyediakan solusi pembayaran digital yang mudah dan aman untuk bisnis Indonesia:

- 🔒 **SSL Terenkripsi** — transaksi aman end-to-end
- 📱 **QRIS** — scan & bayar dari semua e-wallet
- 🏦 **Transfer Bank & Virtual Account** — semua bank utama
- 💚 **GoPay · OVO · Dana · ShopeePay** — e-wallet populer
- 💳 **Visa / Mastercard** — kartu kredit & debit internasional

> Ingin menggunakan Mayar.id untuk project kamu? Kunjungi **[mayar.id](https://mayar.id)**

---

## Thank You 💖
