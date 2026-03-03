#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# stripe-listen.sh
#
# Starts the Stripe CLI webhook listener and automatically injects the
# signing secret into a local .env.local file.
#
# ONE-TIME SETUP (browser auth required):
#   stripe login   ← opens browser, takes 30 seconds
#
# Then just run this script for all subsequent sessions:
#   ./scripts/stripe-listen.sh
# ---------------------------------------------------------------------------

set -euo pipefail

export PATH="$HOME/bin:$PATH"

# Check Stripe CLI is installed
if ! command -v stripe &>/dev/null; then
  echo "❌  stripe CLI not found. It was installed to ~/bin — check your PATH."
  echo "    Run: export PATH=\"\$HOME/bin:\$PATH\""
  exit 1
fi

echo "🎧  Starting Stripe webhook listener → http://localhost:3001/api/webhooks/stripe"
echo ""
echo "    Events: invoice.payment_succeeded, invoice.payment_failed,"
echo "            customer.subscription.deleted, checkout.session.completed"
echo ""
echo "    The signing secret (whsec_...) will be printed below."
echo "    Add it to .env as STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""

stripe listen \
  --forward-to http://localhost:3001/api/webhooks/stripe \
  --events invoice.payment_succeeded,invoice.payment_failed,customer.subscription.deleted,checkout.session.completed
