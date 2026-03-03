#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# test-stripe-webhook.sh
#
# Manually fire a Stripe invoice.payment_succeeded test event at the local
# dev server WITHOUT needing the Stripe CLI listener.
#
# Usage:
#   ./scripts/test-stripe-webhook.sh [customer_id] [subscription_id]
#
# Prerequisites:
#   - Dev server running on http://localhost:3001
#   - STRIPE_SECRET_KEY set in .env
# ---------------------------------------------------------------------------

set -euo pipefail

source "$(dirname "$0")/../.env" 2>/dev/null || true

STRIPE_KEY="${STRIPE_SECRET_KEY:-}"
if [[ -z "$STRIPE_KEY" ]]; then
  echo "❌  STRIPE_SECRET_KEY not set. Check your .env file."
  exit 1
fi

CUSTOMER_ID="${1:-}"
SUBSCRIPTION_ID="${2:-}"

echo "🔑  Using key: ${STRIPE_KEY:0:20}..."
echo ""

# If no IDs given, list existing customers and let the user pick
if [[ -z "$CUSTOMER_ID" ]]; then
  echo "🔍  Fetching Stripe test customers..."
  CUSTOMERS=$(curl -s "https://api.stripe.com/v1/customers?limit=5" \
    -u "$STRIPE_KEY:" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data.get('data', []):
    print(f\"  {c['id']}  {c.get('email','(no email)')}\")
")
  echo "$CUSTOMERS"
  echo ""
  echo "  Pass a customer ID as first argument, e.g.:"
  echo "  ./scripts/test-stripe-webhook.sh cus_abc123 sub_xyz456"
  echo ""
  echo "  Or use the Stripe CLI (one-time browser auth required):"
  echo "  stripe listen --forward-to http://localhost:5000/api/webhooks/stripe"
  exit 0
fi

# -----------------------------------------------------------------------
# Create a minimal test invoice.payment_succeeded payload and POST it
# directly — bypassing signature verification (only works in development).
# To bypass signature verification in dev, ensure STRIPE_WEBHOOK_SECRET is
# NOT set, or patch the handler to skip verification in dev mode.
# -----------------------------------------------------------------------

PAYLOAD=$(python3 -c "
import json, time
payload = {
  'id': 'evt_test_$(date +%s)',
  'object': 'event',
  'type': 'invoice.payment_succeeded',
  'created': int(time.time()),
  'livemode': False,
  'data': {
    'object': {
      'id': 'in_test_$(date +%s)',
      'object': 'invoice',
      'customer': '$CUSTOMER_ID',
      'subscription': '${SUBSCRIPTION_ID:-sub_test_$(date +%s)}',
      'status': 'paid',
      'amount_paid': 4999,
      'currency': 'gbp',
    }
  }
}
print(json.dumps(payload))
")

echo "📤  Sending test invoice.payment_succeeded to http://localhost:3001/api/webhooks/stripe"
echo ""

# Note: signature verification will fail unless STRIPE_WEBHOOK_SECRET matches.
# For local testing without CLI, temporarily set STRIPE_WEBHOOK_SECRET to the
# test event's computed signature, or add a SKIP_WEBHOOK_SIG_CHECK=true env var.
RESPONSE=$(curl -s -X POST http://localhost:3001/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=$(date +%s),v1=bypass_for_testing" \
  -d "$PAYLOAD")

echo "📥  Response: $RESPONSE"
echo ""
echo "💡  To forward real Stripe events locally with signature verification:"
echo "    1. Run once: stripe login  (opens browser)"
echo "    2. Then run: stripe listen --forward-to http://localhost:5000/api/webhooks/stripe"
echo "    3. Copy the whsec_... secret and set STRIPE_WEBHOOK_SECRET in .env"
echo ""
echo "💡  To trigger a real test event via Stripe:"
echo "    stripe trigger invoice.payment_succeeded"
