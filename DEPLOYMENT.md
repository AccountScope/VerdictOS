# VerdictOS Deployment Guide

## ✅ What's Working (Tested)

- ✅ Database schema deployed (14 tables)
- ✅ RLS policies active
- ✅ API authentication (key-based)
- ✅ Action creation (POST /api/v1/actions)
- ✅ Action listing (GET /api/v1/actions)
- ✅ Idempotency enforcement
- ✅ Client isolation

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)

```bash
cd /data/.openclaw/workspace/verdictos-api

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables (add in Vercel dashboard):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERDICTOS_API_SECRET`
- `WEBHOOK_SIGNING_SECRET`

### Option 2: Docker + VPS

```bash
# Build
docker build -t verdictos-api .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://jazrnbmhppwiuezjnlnf.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  verdictos-api
```

## 📋 Post-Deployment Checklist

1. **Create production client:**
   ```sql
   INSERT INTO clients (name) VALUES ('Production Client') RETURNING *;
   ```

2. **Generate secure API key:**
   ```bash
   node -e "const c=require('crypto'); const key='vo_'+c.randomBytes(32).toString('hex'); console.log('Key:',key); console.log('Hash:',c.createHash('md5').update(key).digest('hex'))"
   ```

3. **Insert API key:**
   ```sql
   INSERT INTO api_keys (client_id, key_hash, name)
   VALUES ('your-client-id', 'hash-from-step-2', 'Production Key');
   ```

4. **Test production endpoint:**
   ```bash
   curl https://your-domain.vercel.app/api/v1/health
   ```

## 🔐 Security Checklist

- [ ] Supabase RLS enabled on all tables
- [ ] Service role key secured (env var only)
- [ ] API keys use bcrypt/argon2 (not MD5 - upgrade!)
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Webhook signatures enabled
- [ ] Audit logging active

## 📊 Monitoring

- Supabase Dashboard: Database health, query performance
- Vercel Analytics: API latency, error rates
- Webhook deliveries: Check `webhook_deliveries` table

## 🛠️ Next Development Steps

1. **Rule Engine** - Implement condition evaluation
2. **Risk Scoring** - ML/heuristic risk assessment
3. **Approval Workflows** - Multi-step approval logic
4. **Webhook Delivery** - Retry logic + signature verification
5. **Dashboard** - React/Next.js frontend for action management
6. **SDK** - TypeScript/Python client libraries

## 📝 API Endpoints Available

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/v1/health` | ✅ Working |
| POST | `/api/v1/actions` | ✅ Working |
| GET | `/api/v1/actions` | ✅ Working |
| POST | `/api/v1/rules` | ⚠️ Stub only |
| GET | `/api/v1/rules` | ⚠️ Stub only |
| POST | `/api/v1/webhooks` | ⚠️ Stub only |
| POST | `/api/v1/approvals/:id/approve` | ❌ Not implemented |
| POST | `/api/v1/approvals/:id/reject` | ❌ Not implemented |

## 🔗 Resources

- Supabase Project: https://supabase.com/dashboard/project/jazrnbmhppwiuezjnlnf
- API Docs: See `API_SPEC.md`
- Architecture: See `TECH_ARCHITECTURE.md`
