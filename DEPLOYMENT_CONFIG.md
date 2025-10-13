# Deployment Configuration Guide

This project includes configuration files for both **Netlify** and **Vercel** deployments.

## Files

- `netlify.toml` - Configuration for Netlify deployments
- `vercel.json` - Configuration for Vercel deployments
- `next.config.ts` - Next.js configuration (applies to both platforms)

---

## Netlify Configuration (`netlify.toml`)

### Build Settings

```toml
[build]
  command = "npm run build"
  publish = ".next"
```

- Specifies the build command and output directory
- Uses `@netlify/plugin-nextjs` for Next.js optimizations

### Environment

```toml
[build.environment]
  NODE_VERSION = "20"
```

- Sets Node.js version to 20 for consistency

### Headers

- **API Routes**: No caching (`no-cache, no-store, must-revalidate`)
- **Static Assets**: Long-term caching (1 year, immutable)
- **Public Files**: Long-term caching for logo and ONNX model

---

## Vercel Configuration (`vercel.json`)

### Build Settings

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs"
}
```

- Vercel auto-detects Next.js but explicit configuration ensures consistency
- Uses Vercel's native Next.js support (no plugin needed)

### Headers

Same caching strategy as Netlify:

- **API Routes**: No caching
- **Static Assets**: Long-term caching
- **Public Files**: Long-term caching

### Rewrites

```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/"
  }
]
```

- Handles client-side routing for the SPA

---

## Key Differences

| Feature                | Netlify               | Vercel                      |
| ---------------------- | --------------------- | --------------------------- |
| **Config File**        | `netlify.toml` (TOML) | `vercel.json` (JSON)        |
| **Next.js Support**    | Via plugin            | Native built-in             |
| **Functions**          | Netlify Functions     | Vercel Serverless Functions |
| **Node Version**       | Set in config         | Auto-managed (can override) |
| **Image Optimization** | Via plugin            | Native (but we disabled it) |

---

## Shared Configuration

### Next.js Config (`next.config.ts`)

Both platforms use the same Next.js configuration:

```typescript
images: {
  unoptimized: true,  // Serves images directly
}
```

This ensures:

- ✅ Consistent behavior across platforms
- ✅ No image optimization issues
- ✅ Direct serving from public folder

### Cache Strategy

Both platforms use the same caching headers:

1. **API Routes** (`/api/*`): No caching

   - Ensures dynamic data is always fresh
   - Each API route also sets its own cache headers

2. **Static Assets** (`/_next/static/*`): 1 year cache

   - Build-time generated files with content hashes
   - Safe to cache indefinitely

3. **Public Files** (logo, ONNX): 1 year cache
   - Static files that don't change
   - Reduces bandwidth and improves load times

---

## Environment Variables

### Required for Both Platforms

Make sure to set these in your deployment platform's dashboard:

- `TBA_API_KEY` - The Blue Alliance API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- Any other environment variables your app needs

### Setting Environment Variables

**Netlify:**

1. Go to Site Settings → Environment Variables
2. Add each variable with its value

**Vercel:**

1. Go to Project Settings → Environment Variables
2. Add each variable with its value
3. Choose which environments to apply (Production, Preview, Development)

---

## Deployment Instructions

### Netlify

1. **Connect Repository**

   - Go to Netlify dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Build Settings**

   - Build command: `npm run build` (auto-detected from netlify.toml)
   - Publish directory: `.next` (auto-detected)

3. **Deploy**

   - Click "Deploy site"
   - Netlify will automatically use settings from `netlify.toml`

4. **After Deployment Issues**
   - If you experience caching issues: "Deploys" → "Trigger deploy" → "Clear cache and deploy site"

### Vercel

1. **Connect Repository**

   - Go to Vercel dashboard
   - Click "Add New" → "Project"
   - Import your Git repository

2. **Build Settings**

   - Framework Preset: Next.js (auto-detected)
   - Build command: `npm run build` (uses vercel.json)
   - Output directory: `.next` (auto-detected)

3. **Deploy**

   - Click "Deploy"
   - Vercel will automatically use settings from `vercel.json`

4. **After Deployment**
   - Vercel has better caching by default
   - No manual cache clearing typically needed

---

## Monitoring After Deployment

After deploying to either platform, verify:

- ✅ Logo displays correctly
- ✅ API routes return fresh data
- ✅ Year selection on global pages works
- ✅ Event selection on dashboard works
- ✅ Static assets load quickly
- ✅ No console errors

---

## Troubleshooting

### Issue: Images not loading

**Solution**: Already fixed with `images: { unoptimized: true }` in next.config.ts

### Issue: API data is stale

**Solution**: Cache headers are set to `no-cache` for API routes. If still seeing issues:

- Netlify: Clear cache and redeploy
- Vercel: Redeploy the project

### Issue: Year/Event selection not working

**Solution**: Already fixed with `dynamic = "force-dynamic"` in pages and API routes

### Issue: Build fails

**Solution**: Check build logs for specific errors. Common causes:

- Missing environment variables
- Node version mismatch (ensure Node 20)
- Dependency issues (try `npm ci` locally first)

---

## Performance Considerations

### Build Times

- **Netlify**: ~2-4 minutes (with plugin)
- **Vercel**: ~1-3 minutes (native Next.js support)

### Cold Starts

- **Netlify**: 100-300ms for serverless functions
- **Vercel**: 50-150ms for serverless functions

### CDN Coverage

- **Netlify**: Global CDN with edge caching
- **Vercel**: Global Edge Network with automatic edge caching

Both platforms provide excellent performance for this application.

---

## Recommendation

**For this project, either platform works well:**

- **Choose Netlify if:**

  - You prefer TOML configuration
  - You're already using Netlify for other projects
  - You need specific Netlify features (Forms, Identity, etc.)

- **Choose Vercel if:**
  - You want slightly faster builds
  - You prefer JSON configuration
  - You want the best Next.js integration (created by Next.js team)

Both configurations are maintained and will work identically for your application.
