# 📊 AppMRR - iOS App Revenue Leaderboard

A transparent, public leaderboard showcasing iOS app revenues powered by RevenueCat. Track and compare MRR (Monthly Recurring Revenue) and revenue metrics from verified apps.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/appmrr)

## ✨ Features

- 🏆 **Public Leaderboard** - Rank apps by MRR or 28-day revenue
- ✅ **Verified Metrics** - Data directly from RevenueCat API
- 🔒 **Secure** - API keys encrypted with AES-256-GCM
- 🔄 **Auto-Updates** - Daily metric refresh via cron jobs
- 🌗 **Dark Mode** - Beautiful UI with light/dark themes
- 📱 **Responsive** - Optimized for all devices
- ⚡ **Fast** - Built with Astro for optimal performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (local) or Supabase account (production)
- RevenueCat account with API access

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/appmrr.git
cd appmrr
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to your `.env` file.

4. **Set up the database**

For local development with PostgreSQL:
```bash
./setup-local.sh
```

Or manually:
```bash
createdb appmrr
psql appmrr < schema.sql
```

5. **Start the development server**
```bash
npm run dev
```

Visit `http://localhost:4321` 🎉

## 📦 Tech Stack

- **Framework**: [Astro](https://astro.build) - Fast, content-focused web framework
- **Language**: TypeScript
- **Database**: PostgreSQL / [Supabase](https://supabase.com)
- **Deployment**: [Vercel](https://vercel.com)
- **API**: RevenueCat API v2
- **Styling**: CSS with design tokens (OKLCH color space)
- **Icons**: [Lucide](https://lucide.dev)

## 🗂️ Project Structure

```
appmrr/
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── Header.astro
│   │   ├── LeaderboardTable.astro
│   │   ├── AddAppModal.astro
│   │   └── ...
│   ├── layouts/
│   │   └── Layout.astro     # Main page layout
│   ├── lib/                 # Utilities and business logic
│   │   ├── db.ts            # Database queries
│   │   ├── encryption.ts    # API key encryption
│   │   ├── revenuecat.ts    # RevenueCat API client
│   │   └── validation.ts    # Input validation
│   ├── pages/
│   │   ├── index.astro      # Leaderboard page
│   │   └── api/             # API endpoints
│   ├── scripts/             # Client-side TypeScript
│   │   ├── theme.ts         # Dark mode toggle
│   │   ├── modal.ts         # Modal interactions
│   │   └── ...
│   └── styles/
│       └── globals.css      # Global CSS variables
├── public/                  # Static assets
├── schema.sql              # Database schema
├── supabase-rls-policies.sql
└── vercel.json             # Vercel config (cron jobs)
```

## 🔐 Security

AppMRR takes security seriously:

### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64-byte random salt per encrypted value
- **Storage**: API keys never stored in plaintext

### Rate Limiting
- **Endpoint**: `/api/add-startup`
- **Limit**: 3 requests per hour per IP
- **Protection**: Prevents spam and abuse

### Input Validation
- All inputs sanitized and validated
- SSRF protection for URLs
- SQL injection prevention
- XSS protection

For detailed security information, see [SECURITY.md](./SECURITY.md).

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required: Encryption key for API keys
ENCRYPTION_KEY=your-64-char-hex-string

# Database (choose one)
# For Supabase:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For local PostgreSQL:
POSTGRES_URL=postgresql://postgres:password@localhost:5432/appmrr

# Optional: Cron job protection
CRON_SECRET=your-random-secret
```

### How API Keys Are Encrypted

When a user adds their app:

1. **User Input**: User provides their RevenueCat API key (read-only)
2. **Validation**: Key is validated by fetching metrics from RevenueCat
3. **Encryption Process**:
   - Generate random 64-byte salt
   - Derive encryption key using PBKDF2 (100,000 iterations)
   - Generate random 16-byte IV (initialization vector)
   - Encrypt with AES-256-GCM
   - Generate authentication tag
   - Store: `salt:iv:tag:encrypted_data`
4. **Storage**: Encrypted string stored in database
5. **Decryption**: Only happens server-side during cron job updates

**Security Properties**:
- ✅ Each encryption uses unique salt and IV
- ✅ Authentication tag prevents tampering
- ✅ Keys never exposed in API responses
- ✅ Forward secrecy (changing ENCRYPTION_KEY invalidates all keys)

## 🔄 How It Works

### Adding an App

1. User submits app information and RevenueCat credentials
2. API validates the credentials by fetching metrics
3. API key is encrypted and stored securely
4. Initial metrics are fetched and stored
5. App appears on the leaderboard

### Daily Updates

A Vercel Cron Job runs daily at midnight UTC:

1. Fetches all encrypted API keys from database
2. Decrypts each key (server-side only)
3. Fetches latest metrics from RevenueCat API
4. Updates metrics in database
5. Leaderboard automatically reflects new data

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Setup for Development

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/appmrr.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Make your changes
6. Test locally: `npm run dev`
7. Build to verify: `npm run build`
8. Commit your changes: `git commit -m "feat: add amazing feature"`
9. Push to your fork: `git push origin feature/your-feature`
10. Open a Pull Request

### Code Style

- **TypeScript**: Use explicit types
- **Components**: Add header comments explaining purpose
- **Formatting**: Follow existing code style
- **Commits**: Use conventional commits (feat, fix, docs, etc.)

### Areas for Contribution

- 🌍 **Internationalization** - Add support for more languages
- 📊 **Analytics** - Enhanced metrics and charts
- 🎨 **UI/UX** - Improve design and user experience
- 🔒 **Security** - Additional security measures
- 📱 **Features** - New functionality and improvements
- 📝 **Documentation** - Improve docs and examples
- 🐛 **Bug Fixes** - Find and fix bugs

## 📋 API Endpoints

### `POST /api/add-startup`

Add a new app to the leaderboard.

**Request Body**:
```json
{
  "name": "My Awesome App",
  "appStoreId": "1234567890",
  "websiteUrl": "https://myapp.com",
  "founderUsername": "johndoe",
  "projectId": "revenuecat-project-id",
  "revenuecatApiKey": "sk_xxxxxxxxxxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "startup": {
    "id": 1,
    "name": "My Awesome App"
  }
}
```

### `GET /api/cron/update-metrics`

Cron endpoint for updating metrics (protected by `CRON_SECRET`).

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Configure environment variables:
     - `ENCRYPTION_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `CRON_SECRET`

3. **Deploy!**

The cron job will automatically run daily at midnight UTC.

### Database Setup (Supabase)

1. Create a Supabase project
2. Run `schema.sql` in SQL Editor
3. Copy your project URL and service role key
4. Add to Vercel environment variables

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [TrustMRR](https://trustmrr.com)
- Built with [Astro](https://astro.build)
- Powered by [RevenueCat](https://www.revenuecat.com)

## 📬 Contact

Have questions or suggestions? Open an issue or reach out!

---

**Made with ❤️ by the indie app community**

⭐ Star this repo if you find it useful!
