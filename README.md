# VisionPass - Visual Passcode v0.7.0

English | [中文文档 (Chinese README)](./documents/readme_cn.md)

VisionPass is a modern full-stack visual secret sharing system based on client-side visual feature extraction and server-side geometric consistency verification. Users can securely seal secret text using a reference image. The recipient can only unlock and view the secret message by pointing their camera at the exact same or highly similar physical scene (or uploading a matching image), verified via client-side ORB feature extraction and server-side RANSAC homography matrix inlier analysis.

Built on top of the modern **TanStack Start (React 19 + Nitro + Vite + Bun)** full-stack architecture, frontend and backend communicate isomorphically through type-safe **Server Functions (`createServerFn`)**, following key industrial-grade security principles such as **zero raw image upload**, **dual-token decentralized decoupling**, and **server-side AES-256-GCM AEAD encryption**.

---

## 🌟 Key Features & Architectural Highlights

1. **Privacy-First (Zero Raw Images to the Cloud)**:
   - Image decoding, resizing (longest edge 640px), grayscale conversion, and ORB feature extraction are executed inside an isolated browser **Web Worker** thread. Raw images are never uploaded or stored on servers or databases.
2. **Pure TypeScript Industrial-Grade Geometric Matching Engine**:
   - Zero C++ or Python dependencies on the server. Implemented in high-performance pure TypeScript: **Hamming KNN Retrieval + Lowe's Ratio Test + DLT / Gaussian Elimination + RANSAC 2D Homography Matrix inlier verification**, with matching latency $\le 5\text{ms}$, effectively blocking false matches and textured spoofing.
3. **Dual-Token Security Model & AEAD Secret Encryption**:
   - Uses `publicToken` (CSPRNG 16 bytes) + `displayPasscode` (Base32 human-readable passcode). The database stores only `HMAC-SHA-256(TOKEN_PEPPER, token)` one-way hashes to prevent plaintext token leaks.
   - Secret messages are stored with standard **AES-256-GCM** authenticated encryption and decrypted in real-time by the server only after geometric feature matching criteria are satisfied.
4. **Decentralized & Block-Resistant Share Posters**:
   - The QR code encodes only the plain passcode (`displayPasscode`), decoupled from any deployment domain. This results in sparse, easily scannable, and anti-blocking QR matrices.
   - Supports draggable QR-overlay share poster generation with offline Canvas full-resolution PNG export.
5. **Continuous Camera Session Experience**:
   - Combines native `BarcodeDetector` with high-performance `jsQR` dual engines for millisecond-level instant QR scanning.
   - Once a passcode is detected, the camera stream stays active without reloading, smoothly transitioning into real-time ORB keypoint starfield canvas rendering (`KeypointsCanvas`) and automatic frame matching.
6. **Responsive Design, Internationalization (i18n) & Playground / Docs Center**:
   - **Landing Page Vision**: In-depth exposition of the "physical objects as digital keys" philosophy and use cases.
   - **Playground**: All-in-one studio for creating credentials, poster design, and live camera stream verification.
   - **Interactive Technical Whitepaper (`/docs`)**: Systematic breakdown of vision, mathematical algorithms, full-stack tech choices, and end-to-end sequence diagrams.
   - **Internationalization (i18n)**: Seamless English and Simplified Chinese switching.
   - **Centralized Constants**: Application version and repository links managed centrally in `CONSTANTS.APP`.

---

## 🛠️ Tech Stack

- **Full-Stack Framework**: [TanStack Start](https://tanstack.com/start) (React 19, TypeScript, Bun, Vite, Nitro)
- **Routing & State Management**: TanStack Router (Type-safe route tree), TanStack Query
- **Client-Side Computer Vision**: OpenCV.js WASM (Web Worker isolated thread, non-blocking 60fps UX)
- **QR Encoding & Decoding**: `qrcode` (poster/stand-alone code generation), `jsQR` (cross-platform rapid scanning)
- **Cryptography & Security**: Node.js Crypto (`aes-256-gcm`, `hmac-sha256`), Sliding-window in-memory rate limiting
- **Database & ORM**: PostgreSQL (Neon / Supabase / Self-hosted), Drizzle ORM
- **Styling & Icons**: Tailwind CSS v4, Lucide React
- **Internationalization (i18n)**: Lightweight React Context i18n
- **Linter & Formatter**: Biome

---

## 📁 Directory Structure

```text
visionpass/
├── src/
│   ├── routes/                   # TanStack Router route tree
│   │   ├── __root.tsx            # Global layout (Header, Nav, Footer, Constants, i18n Provider)
│   │   ├── index.tsx             # Landing Page vision & value presentation
│   │   ├── playground.tsx        # /playground Studio (Create & Verify tab switcher)
│   │   ├── docs.tsx              # /docs Technical whitepaper & algorithm docs
│   │   ├── create.tsx            # /create redirect to /playground?tab=create
│   │   ├── read.tsx              # /read redirect to /playground?tab=verify
│   │   └── r.$token.tsx          # /r/:token Dedicated direct verify & unlock page
│   ├── components/               # Interactive UI components
│   │   ├── playground/           # Playground modules (CreateSection, ReadSection)
│   │   ├── poster/               # Draggable poster generator (PosterGenerator, QrOverlayDraggable)
│   │   ├── scanner/              # Camera scanner & device switcher (QrScannerView, CameraSourceSelect)
│   │   ├── viewer/               # Secret viewer & ORB keypoints canvas (SecretViewer, KeypointsCanvas)
│   │   ├── image-picker.tsx      # Local file & photo picker
│   │   ├── qr-result.tsx         # Credential creation result & mode switcher
│   │   └── processing-state.tsx  # Processing loading feedback
│   ├── hooks/                    # Core React Hooks
│   │   ├── use-camera-stream.ts  # MediaStream state & device management
│   │   ├── use-barcode-scanner.ts# Native BarcodeDetector + jsQR dual-engine scanner hook
│   │   └── use-live-orb-matcher.ts# 800ms video sampling, Worker extraction & in-flight lock matcher hook
│   ├── workers/                  # Web Worker feature extraction pipeline
│   │   ├── opencv.worker.ts      # OpenCV.js WASM resize, grayscale, ORB extractor
│   │   └── worker-types.ts       # Worker message protocol types
│   ├── server/                   # Server-only logic (Nitro bundled)
│   │   ├── crypto/               # CSPRNG Token generation, HMAC hashing & AES-256-GCM
│   │   ├── db/                   # Drizzle ORM config & PostgreSQL Schema
│   │   ├── matcher/              # Pure TypeScript geometric matcher (KNN, Lowe Ratio, RANSAC)
│   │   ├── security/             # IP sliding-window rate limiting & security guards
│   │   ├── functions/            # TanStack Start createServerFn (create, meta, verify)
│   │   └── utils/                # Structured server logging
│   ├── i18n/                     # Internationalization dictionaries & context provider
│   │   ├── locales/              # English & Chinese translation dictionaries (en.ts, zh.ts)
│   │   └── index.tsx             # I18nProvider & useI18n Hook
│   └── lib/                      # Shared utility libraries
│       ├── constants.ts          # Global configuration constants (APP version, match thresholds)
│       ├── feature-codec.ts      # Binary descriptor Base64URL codec
│       ├── feature-schema.ts     # Zod payload & feature schema (OrbFeaturePayloadV1)
│       └── vision-worker-client.ts# Web Worker client wrapper
├── tests/                        # Unit test suites (Crypto, Matcher, Security)
├── drizzle/                      # Database migration SQL files
├── documents/                    # Documentation & Chinese README (readme_cn.md)
└── vite.config.ts                # Vite / Nitro / Tailwind full-stack build config
```

---

## 🚀 Local Development Guide

### 1. Prerequisites

Make sure you have [Bun](https://bun.sh/) (recommended, `>= 1.1`) or Node.js (`>= 20`) installed.

```bash
# Clone the repository and enter directory
git clone https://github.com/deadlyedge/visionpass.git
cd visionpass

# Install dependencies
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required variables:

```env
# PostgreSQL database connection string (supports Neon, Supabase, Vercel Postgres, etc.)
DATABASE_URL=postgresql://postgres:password@localhost:5432/visionpass

# Public application URL
APP_ORIGIN=http://localhost:3000

# (Optional) Token pepper and AES encryption secret key (defaults provided for development)
# TOKEN_PEPPER=your_custom_pepper_secret
# SECRET_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. Initialize Database Schema

Push the Drizzle schema directly to your PostgreSQL database:

```bash
bun run db:push
```

### 4. Run Test Suite

```bash
bun test
```

### 5. Start Full-Stack Dev Server

```bash
bun dev
```

Open `http://localhost:3000` in your browser. TanStack Start provides full-stack live HMR for both frontend React components and backend Server Functions.

---

## ☁️ Production Deployment (Vercel / Node.js)

VisionPass is designed to be easily deployed on [Vercel](https://vercel.com/), Docker containers, or any Node.js hosting platform:

### Deploy to Vercel:
1. Push your repository to GitHub.
2. Import the project in the Vercel Dashboard, framework preset can be set to **Other** (or auto-detected Vite/Nitro).
3. Set production environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (Serverless Postgres like [Neon](https://neon.tech/) recommended).
   - `APP_ORIGIN`: Your production domain (e.g. `https://your-domain.vercel.app`).
   - `SECRET_ENCRYPTION_KEY`: 32-byte AES key (64-character Hex string).
   - `TOKEN_PEPPER`: Production HMAC pepper secret.
4. Click **Deploy**.

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `bun dev` | Start TanStack Start full-stack development server |
| `bun test` | Run automated test suites (Crypto, RANSAC matcher, Security) |
| `bun run build` | Perform TypeScript type check and build full-stack production bundle |
| `bun run preview` | Preview the production build locally |
| `bun run db:push` | Push Drizzle schema directly to PostgreSQL |
| `bun run db:generate` | Generate Drizzle incremental SQL migrations |
| `bunx @biomejs/biome check` | Run Biome linting and code formatting checks |

---

## 📄 License

MIT
