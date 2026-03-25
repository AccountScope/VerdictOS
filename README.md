# VerdictOS

**The Control Layer for AI Actions**

[![Pilot Ready](https://img.shields.io/badge/status-pilot%20ready-green)]()
[![API Stable](https://img.shields.io/badge/API-stable-blue)]()
[![Readiness](https://img.shields.io/badge/readiness-90%25-brightgreen)]()

> Approve, score, and audit AI-driven decisions with confidence.

---

## 🎯 What is VerdictOS?

VerdictOS sits between your AI agents and critical business actions, providing:

- **Real Execution Control:** Actions truly blocked/allowed (not advisory)
- **Risk Scoring:** Industry-specific models (fintech, healthcare, legal)
- **Approval Workflows:** Human-in-the-loop for high-risk decisions
- **Complete Audit Trail:** Full compliance logging for GDPR, HIPAA, SOC 2
- **Developer-First API:** 5-minute integration, not bloated enterprise suite

---

## ⚡ Quick Start

**1. Submit an action:**
```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "X-API-Key: YOUR_KEY" \
  -H "X-Client-ID: YOUR_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "send_payment",
    "payload": {"amount": 50000}
  }'
```

**2. Get a decision:**
```json
{
  "decision": "REQUIRE_APPROVAL",
  "allowed": false,
  "risk_score": "HIGH",
  "numeric_score": 70,
  "explanation": "⚠️ High risk: large transaction...",
  "triggered_rules": ["large_transaction"]
}
```

**3. Execute or wait for approval:**
- **ALLOW:** Execute immediately
- **REQUIRE_APPROVAL:** Wait for human approval
- **BLOCK:** Do not execute

---

## 🏗️ Architecture

```
AI Agent → VerdictOS API → Decision Engine → Action Execution
                ↓
          Approval Queue
                ↓
          Human Approver
                ↓
          Audit Trail
```

**Stack:**
- **API:** Next.js 14 + TypeScript (Vercel)
- **Database:** Supabase (PostgreSQL)
- **Security:** bcryptjs, SHA-256 tokens, rate limiting
- **Regions:** US, UK, EU (auto-detected compliance)

---

## 📚 Documentation

- [Quick Start](docs/QUICKSTART.md) - 5-minute integration
- [API Reference](docs/API_REFERENCE.md) - Complete endpoint docs
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Production readiness
- [Quick Reference](QUICK_REFERENCE.md) - Cheat sheet
- [Pilot Onboarding](PILOT_ONBOARDING.md) - Early access guide

**Examples:**
- [Node.js/TypeScript](examples/node-typescript.ts)
- [Python](examples/python.py)
- [Interactive Playground](public/playground.html)

---

## 🔒 Security

- ✅ bcryptjs hashing for API keys
- ✅ SHA-256 hashed approval tokens
- ✅ Single-use tokens (72-hour expiry)
- ✅ 1MB payload limit
- ✅ 500 req/min rate limit per client
- ✅ Complete audit trail
- ✅ Tenant isolation

---

## 🏭 Industries

**Fintech:**
- Large transactions ($100K+)
- New payees/vendors
- High-risk countries
- Wire transfers
- Regulatory compliance

**Healthcare:**
- Controlled substance prescriptions
- High-dose medications
- Drug interactions
- Patient safety checks
- HIPAA compliance

**Legal:**
- Conflict of interest detection
- Privileged information handling
- Multi-party contracts
- Court filings
- Regulatory compliance

---

## 📊 Status

**Current Version:** 1.0.0-pilot
**Readiness:** 90/100
**Status:** Production-ready for pilot launch

**What's Working:**
- ✅ Complete control flows (allow, approve, block)
- ✅ Secure approval tokens
- ✅ Audit trail
- ✅ Industry-specific risk models
- ✅ End-to-end verified

**What's Pending:**
- ⏳ Email notifications (RESEND_API_KEY needed)
- ⏳ Dashboard deployment (builds locally)
- ⏳ Production monitoring (Sentry)

---

## 🚀 Pilot Program

**Apply for early access:**
1. Email: admin@accountscope.app
2. Subject: "VerdictOS Pilot Application"
3. Include: Company, use case, industry, volume

**Pilot benefits:**
- Free access (3 months)
- Direct support
- Custom risk models
- Priority features

---

## 🛠️ Development

**Prerequisites:**
- Node.js 18+
- npm or yarn
- Supabase account

**Setup:**
```bash
git clone https://github.com/AccountScope/VerdictOS.git
cd VerdictOS
npm install
cp .env.example .env.local
# Add Supabase credentials
npm run dev
```

**Deployment:**
```bash
vercel --prod
```

---

## 📈 Metrics

**Readiness Score:** 90/100
**Sprint Duration:** 13 hours
**Issues Found:** 25
**Issues Fixed:** 23
**Test Coverage:** Core flows verified
**Production Deployments:** 20+

---

## 📝 License

Proprietary - All rights reserved

---

## 💬 Support

**Contact:** admin@accountscope.app
**Status:** https://api.verdictos.tech/api/health
**Docs:** https://github.com/AccountScope/VerdictOS

---

**Built with brutal honesty. Shipped with confidence. 🚀**
