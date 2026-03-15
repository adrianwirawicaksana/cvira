## 🚀 Getting Started

Ikuti langkah berikut untuk menjalankan project di lokal.

### 1. Clone Repository

```bash
git clone https://github.com/username/nama-repo.git
cd nama-repo
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

Kemudian isi value sesuai konfigurasi API kamu.

Contoh struktur environment:

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
npm start
```

Aplikasi akan berjalan di:

```
http://localhost:3000
```

---

## ☁️ Deployment

Project ini **tidak menggunakan backend tradisional**, melainkan menggunakan **serverless functions di Vercel**.

### Deploy ke Vercel

1. Install Vercel CLI (optional)

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

Pastikan **Environment Variables** sudah diset di dashboard Vercel sebelum deployment.

---

## ⚙️ Tech Stack

* Frontend Web Application
* Serverless Functions
* AI Integration (LLM API)
* Deployment: Vercel
