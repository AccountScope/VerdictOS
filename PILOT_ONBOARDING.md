# VerdictOS Pilot Program - Onboarding Guide

**Welcome to the VerdictOS Early Access Program!**

You're one of the first companies to implement AI action governance. This guide will get you from zero to production in 15 minutes.

---

## 🎯 What You'll Get

**Control Layer for AI Actions:**
- Approve/reject AI-driven decisions before execution
- Industry-specific risk scoring (0-100)
- Complete audit trail for compliance
- Human-in-the-loop safety for high-risk actions

**Your pilot includes:**
- ✅ Free access during pilot period (3 months)
- ✅ Direct support (admin@accountscope.app)
- ✅ Priority feature requests
- ✅ Custom risk models for your use case
- ✅ Migration support at end of pilot

---

## ⚡ 15-Minute Setup

### Step 1: Get Your Credentials (2 mins)

**We'll provide:**
- API URL: `https://api.verdictos.tech`
- Client ID: `your-unique-client-id`
- API Key: `your-api-key`

**You'll need:**
- Approver email (e.g., `cfo@yourcompany.com`)
- Industry vertical (fintech, healthcare, legal, or other)
- Region (US, UK, EU)

### Step 2: Test the API (3 mins)

**Low-risk test (auto-allow):**
```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Client-ID: YOUR_CLIENT_ID" \
  -H "Idempotency-Key: test-1" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "send_email",
    "requested_by": "ai-agent@yourcompany.com",
    "payload": {
      "to": "customer@example.com",
      "subject": "Order Confirmation"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "action_id": "...",
    "decision": "ALLOW",
    "allowed": true,
    "risk_score": "LOW",
    "explanation": "✅ Low risk: This action meets all safety requirements..."
  }
}
```

**High-risk test (approval required):**
```bash
curl -X POST https://api.verdictos.tech/api/v1/actions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-Client-ID: YOUR_CLIENT_ID" \
  -H "Idempotency-Key: test-2" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "send_payment",
    "requested_by": "ai-agent@yourcompany.com",
    "approver_email": "cfo@yourcompany.com",
    "payload": {
      "amount": 100000,
      "recipient": "new-vendor@example.com"
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "action_id": "...",
    "decision": "REQUIRE_APPROVAL",
    "allowed": false,
    "risk_score": "HIGH",
    "explanation": "⚠️ High risk detected: high-value transaction, new recipient...",
    "triggered_rules": ["large_transaction", "new_payee"]
  }
}
```

### Step 3: Integrate with Your AI Agent (10 mins)

**Before executing any AI action, call VerdictOS:**

```python
import requests

def execute_ai_action(action_type, payload, requested_by):
    # 1. Submit to VerdictOS for approval
    response = requests.post(
        "https://api.verdictos.tech/api/v1/actions",
        headers={
            "X-API-Key": "YOUR_API_KEY",
            "X-Client-ID": "YOUR_CLIENT_ID",
            "Idempotency-Key": f"{action_type}-{timestamp()}",
            "Content-Type": "application/json"
        },
        json={
            "action_type": action_type,
            "requested_by": requested_by,
            "approver_email": "cfo@yourcompany.com",
            "payload": payload
        }
    )
    
    result = response.json()
    
    # 2. Check decision
    if result["data"]["allowed"]:
        # Low-risk: Execute immediately
        return execute_real_action(action_type, payload)
    elif result["data"]["decision"] == "REQUIRE_APPROVAL":
        # High-risk: Wait for human approval
        return {
            "status": "pending_approval",
            "action_id": result["data"]["action_id"],
            "message": "Action requires approval. Email sent to approver."
        }
    else:  # BLOCK
        # Blocked: Do not execute
        return {
            "status": "blocked",
            "reason": result["data"]["explanation"]
        }
```

**That's it!** Your AI now has human oversight.

---

## 📧 Approval Flow

**During pilot (manual):**
1. High-risk action submitted
2. We send approval email to your approver
3. Approver clicks "Approve" or "Reject" link
4. Action executes or gets blocked
5. Full audit trail logged

**Post-pilot (automated):**
- Dashboard for approval queue
- Slack/Teams integration
- Multi-step approval chains
- Automated low-risk allowlisting

---

## 🎯 Pilot Success Criteria

**Week 1:**
- [ ] API integrated
- [ ] 10+ actions submitted
- [ ] 1+ approval flow completed

**Week 2-4:**
- [ ] Custom risk rules defined
- [ ] 100+ actions processed
- [ ] Team trained on approval workflow

**Month 2-3:**
- [ ] Production deployment
- [ ] 1,000+ actions/month
- [ ] Compliance audit ready

---

## 💬 Support

**Got questions? We're here:**
- Email: admin@accountscope.app
- Response time: <4 hours (business days)
- Emergency: Same email with [URGENT] subject

**Weekly check-ins:**
- We'll schedule 30-min calls weekly
- Review metrics, feedback, blockers
- Iterate on risk models together

---

## 📊 What We're Measuring

**Your success metrics:**
- Action volume (target: 100+/week)
- Approval rate (high-risk actions)
- False positive rate (blocked actions that should have allowed)
- Time to approval (target: <2 hours)

**Your feedback:**
- What rules are too strict?
- What rules are too loose?
- What features are you missing?
- What's painful about the workflow?

---

## 🚀 Next Steps

1. **Reply to onboarding email** with:
   - Primary use case (what AI actions?)
   - Approver email(s)
   - Preferred check-in time
   
2. **Integrate API** (use quickstart above)

3. **Submit first 10 test actions** (mix of low/high risk)

4. **Schedule kickoff call** (30 mins, this week)

---

**Welcome aboard! Let's build the control layer for AI together. 🎉**

Questions? → admin@accountscope.app
