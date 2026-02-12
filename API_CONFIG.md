# API Configuration Guide

This document explains how API base URLs are configured for the Source frontend application.

## Overview

The source application uses a consistent API base URL configuration that works both in local development and production deployment.

## Configuration Priority

The API base URL is determined by the following priority:

1. **Environment Variable** (`VITE_API_BASE_URL`) - If set, this takes precedence
2. **Production Mode** - Uses empty string (relative paths) when built for production
3. **Development Mode** - Uses `http://localhost:8080` for local development

## Usage

### Local Development (Default)

No configuration needed! The app will automatically use `http://localhost:8080` when running in development mode.

```bash
# Just start the dev server
npm run dev
```

### Production with Reverse Proxy

When deploying behind a reverse proxy (like nginx), the app will automatically use relative paths (empty base URL). This means:

- API calls go to the same origin as the frontend
- Example: If frontend is at `https://example.com/source`, API calls go to `https://example.com/auth/login`
- Your reverse proxy should route `/api/*` or `/*` to the backend server

### Custom Configuration

If you need to override the default behavior, create a `.env` file in the project root:

```env
# For production with custom API endpoint
VITE_API_BASE_URL=/api

# Or for a different server entirely
VITE_API_BASE_URL=https://api.example.com
```

## Availability endpoint configuration (OTA)

When your source uses an **HTTP endpoint** for availability (instead of gRPC), the middleware can send either JSON or OTA XML. Configuration is stored in the **backend** for your company (not in this frontend):

| Option | Description |
|--------|-------------|
| `useOtaAvailabilityXml` | When `true`, the middleware POSTs **OTA_VehAvailRateRQ** XML to your availability URL (e.g. `your-endpoint/availability` or `pricetest2.php`) instead of JSON. Use this when your API expects OTA XML. |
| `availabilityRequestorId` | RequestorID value in the OTA request (default `1000097`). Set if your supplier requires a specific ID. |

**Response:** Your HTTP availability endpoint can return:

- **Flat JSON array** of offers (e.g. `[{ supplier_offer_ref, vehicle_class, make_model, currency, total_price, ... }]`), or  
- **OTA VehAvailRS-style JSON** (root with `VehAvailRSCore`, `VehRentalCore`, `VehVendorAvails.VehVendorAvail.VehAvails.VehAvail` array). The middleware auto-detects this and parses VehTerms, VehicleCharges, TotalCharge, PricedEquips, PictureURL, DoorCount, Baggage, and location details so agents receive full pricing and terms.

Ask your administrator to set `useOtaAvailabilityXml` and `availabilityRequestorId` in the backend if your endpoint expects OTA XML (e.g. pricetest2.php-style APIs). See the **Getting Started** and **SDK Guide** in the Docs section for full details.

## Implementation

Configuration file: `src/lib/apiConfig.ts`

All API clients use this configuration:
- `src/lib/api.ts`
- `src/api/http.ts` (TypeScript)
- `src/api/http.js` (JavaScript)

