# Footware Ecommerce Site

A full-stack, production-ready footwear ecommerce platform built with **Spree Commerce**, **Next.js**, and modern cloud infrastructure. This is a complete DTC (Direct-to-Consumer) and B2B wholesale solution designed for high performance and scalability.

## 🎯 Project Overview

This repository contains a complete ecommerce ecosystem for a footwear business, consisting of three main components:

- **Backend**: Spree Commerce Rails API server
- **Storefront**: Next.js 16 React 19 customer-facing site
- **Infrastructure**: Deployment configuration and documentation

## 📦 What's Included

### Project Structure

```
Footware-Ecom-Site/
├── backend/              # Spree Commerce Rails backend
├── storefront/           # Next.js 16 / React 19 customer storefront
├── infra/                # Infrastructure & deployment guides
└── README.md             # This file
```

### Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Backend** | Ruby on Rails + Spree | Commerce engine with API |
| **Storefront** | Next.js 16, React 19, TypeScript | Server-first architecture |
| **Database** | PostgreSQL | Supabase managed (production) |
| **Storage** | Object Storage | S3-compatible (Cloudflare R2 or AWS S3) |
| **Infrastructure** | Docker, Docker Compose | Local development & containerization |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |

**Language Composition**: 
- TypeScript: 70.3% (Storefront)
- Ruby: 23.6% (Backend)
- Shell: 2.2% (Scripts)
- JavaScript: 1.6%
- Dockerfile: 1.1%
- CSS: 0.7%
- Other: 0.5%

## 🚀 Features

### Core Ecommerce Features
- ✅ **Product Catalog**: Browse, search, filter by categories with faceted navigation
- ✅ **Product Details**: Rich product information with variant selection and media
- ✅ **Shopping Cart**: Server-side cart state management
- ✅ **One-Page Checkout**: Guest and authenticated checkout with multi-shipment support
- ✅ **Payment Processing**: Native Stripe, Adyen, PayPal integration with 3DS-Secure
- ✅ **Order Management**: Order history, tracking, detailed order views
- ✅ **Customer Accounts**: Profile management, address book, saved payment methods

### Advanced Features
- ✅ **Wholesale/B2B Portal**: Storefront gating, per-customer pricing, account approval workflows
- ✅ **Multi-Region Support**: Country, currency, and language switching via URL segments
- ✅ **Coupon Codes & Gift Cards**: Full promotion support with store credit
- ✅ **Transactional Emails**: Order confirmation, shipping notifications, password reset (via Resend + react-email)
- ✅ **SEO Ready**: Meta tags, JSON-LD, OpenGraph built-in
- ✅ **Analytics**: Google Tag Manager & Google Analytics 4 ecommerce events
- ✅ **Error Tracking**: Sentry integration for server and client-side monitoring

### Performance
- **Lighthouse Scores** (Desktop/Mobile):
  - Performance: 98/88
  - Accessibility: 100/100
  - Best Practices: 100/100
  - SEO: 100/100

## 🏗️ Architecture

### Server-First Design

```
Browser → Server Action → @spree/sdk → Spree REST API
         (with httpOnly cookies)
```

**Security & Performance**:
- All API calls happen server-side using Next.js Server Actions
- Auth tokens and cart tokens stored in secure httpOnly cookies
- Spree API key never exposed to browser
- Cache revalidation via Next.js cache tags
- No client-side API calls

### Deployment Topology (Production)

**Database**: Supabase PostgreSQL (Mumbai / ap-south-1)
- Managed PostgreSQL instance in Mumbai for minimal latency
- Persistent connection pool from Spree

**Backend**: Fly.io (Mumbai - `bom` region)
- Docker container running Spree with Puma and Solid Queue
- Private network connection to Supabase

**Storefront**: Vercel (Node Runtime)
- SSR / dynamic Server Actions in Mumbai region
- Static shell and cached catalog distributed globally via CDN
- Optimized images with Next.js Image Component

**Media**: Object Storage (S3-compatible)
- Original product imagery stored in S3
- Dynamically transformed via Next.js image optimization

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: 20+ (required for Next.js 16)
- **Ruby**: 3.x+ (for Rails backend)
- **Docker & Docker Compose**: For local development
- **PostgreSQL**: 18+ (via Docker)
- **pnpm**: Package manager

### Local Development

#### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/Punit-Dethe/Footware-Ecom-Site.git
   cd Footware-Ecom-Site
   ```

2. **Start services**
   ```bash
   docker-compose up
   ```

   Services will be available at:
   - Backend: `http://localhost:4000`
   - Storefront: `http://localhost:3001`
   - PostgreSQL: `postgres://postgres@localhost:5432/spree_development`

#### Backend Setup

```bash
cd backend

# Install dependencies
bundle install

# Setup database
rails db:setup

# Start server
rails server
```

Environment variables are documented in [backend/README.md](./backend/README.md).

#### Storefront Setup

```bash
cd storefront

# Install dependencies
pnpm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Spree API credentials:
# SPREE_API_URL=http://localhost:4000
# SPREE_PUBLISHABLE_KEY=your_publishable_key

# Start dev server
pnpm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Testing

**Storefront Tests**:
```bash
cd storefront

# Unit & integration tests
pnpm test

# End-to-end tests (requires Docker)
pnpm run e2e:up
pnpm run test:e2e
```

### Production Build

**Backend**:
```bash
cd backend
RAILS_ENV=production rails assets:precompile
rails server -e production
```

**Storefront**:
```bash
cd storefront
pnpm run build
pnpm start
```

## 📚 Documentation

- **Backend**: See [backend/README.md](./backend/README.md)
  - Installation, customization, and deployment guides
  - Spree Commerce documentation at [spreecommerce.org](https://spreecommerce.org)

- **Storefront**: See [storefront/README.md](./storefront/README.md)
  - Architecture deep dive
  - Multi-region setup
  - Customization guide
  - Transactional emails

- **Infrastructure**: See [infra/README.md](./infra/README.md)
  - Local development setup
  - Production deployment topology
  - Database configuration
  - Deployment targets

## 🔧 Key Libraries & SDKs

| Package | Purpose |
|---------|---------|
| [@spree/sdk](https://www.npmjs.com/package/@spree/sdk) | Official typed Spree REST API client |
| [Spree Commerce](https://spreecommerce.org) | Ruby on Rails ecommerce engine |
| [Next.js 16](https://nextjs.org) | React framework with App Router & Server Components |
| [React 19](https://react.dev) | Latest React with improved Server Components |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first CSS framework |
| [TypeScript](https://www.typescriptlang.org) | Static type checking for JavaScript |
| [Sentry](https://sentry.io) | Error tracking and performance monitoring |
| [Resend](https://resend.com) | Transactional email service |

## 🌍 Multi-Region Support

The storefront supports multiple countries, currencies, and languages from a single deployment:

- URL structure: `/{country}/{locale}` (e.g., `/us/en/`, `/de/de/`, `/uk/en/`)
- Powered by Spree Markets
- Edge middleware for routing and localization

See [storefront/README.md](./storefront/README.md#multi-region) for configuration.

## 💳 Payment Methods

Native support for multiple payment providers:
- **Stripe**: Credit cards, Apple Pay, Google Pay, SEPA
- **PayPal**: Full integration with PayPal ecosystem
- **Adyen**: Multi-payment provider with 3DS-Secure
- **Gift Cards & Store Credit**: Built-in support

All payments are PCI-compliant with card data never touching your server.

## 🔐 Security

- **Server-First Architecture**: API calls only via secure server-side code
- **httpOnly Cookies**: Auth tokens stored securely, inaccessible to JavaScript
- **No Exposed Credentials**: Spree API key never sent to browser
- **PCI Compliance**: Payment processing via secure providers
- **3DS-Secure Support**: Enhanced payment security
- **Sentry Monitoring**: Real-time error and security issue tracking

## 📊 Analytics & SEO

- **Google Analytics 4**: Ecommerce event tracking built-in
- **Google Tag Manager**: Custom event configuration
- **Meta Tags**: Automatic SEO meta tag generation
- **JSON-LD**: Structured data for search engines
- **OpenGraph**: Social media sharing optimization

## 🚢 Deployment

### Recommended Deployment Targets

- **Backend**: [Fly.io](https://fly.io), [Heroku](https://www.heroku.com), or self-hosted Docker
- **Storefront**: [Vercel](https://vercel.com) (recommended for Next.js)
- **Database**: [Supabase](https://supabase.com) or managed PostgreSQL
- **Storage**: AWS S3, Cloudflare R2, or compatible service

See [infra/README.md](./infra/README.md) for detailed deployment guides.

## 📝 Environment Variables

Both backend and storefront require environment configuration:

**Backend** ([backend/README.md](./backend/README.md#environment-variables)):
- Database credentials
- Payment provider keys
- Email service configuration
- API keys

**Storefront** ([storefront/README.md](./storefront/README.md#getting-started)):
- `SPREE_API_URL`: Your Spree backend URL
- `SPREE_PUBLISHABLE_KEY`: Public API key
- Analytics and error tracking keys
- Optional: Wholesale portal, email, and multi-region settings

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE.md](./LICENSE.md) for details.

## 🆘 Support

- **Spree Commerce Documentation**: [spreecommerce.org](https://spreecommerce.org)
- **Spree API Reference**: [spreecommerce.org/docs/api](https://spreecommerce.org/docs/api-reference)
- **Next.js Documentation**: [nextjs.org](https://nextjs.org)
- **GitHub Issues**: [Report issues here](https://github.com/Punit-Dethe/Footware-Ecom-Site/issues)

## 🎓 Learning Resources

- [Spree Customization Guide](https://spreecommerce.org/docs/developer/customization)
- [Spree Deployment Guide](https://spreecommerce.org/docs/developer/deployment)
- [Next.js Architecture Guide](https://spreecommerce.org/docs/developer/storefront/nextjs/architecture)
- [Multi-Region Setup Guide](https://spreecommerce.org/docs/developer/storefront/nextjs/multi-region)
- [Transactional Email Guide](https://spreecommerce.org/docs/developer/storefront/nextjs/transactional-emails)

---

**Happy building! 🎉**

Built with ❤️ using Spree Commerce, Next.js, and modern cloud infrastructure.
