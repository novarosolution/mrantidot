#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
API="${BASE_URL}/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

ADMIN_IDENTIFIER="${ADMIN_PHONE:-9000000001}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

jq_val() { echo "$1" | jq -r "$2"; }

login() {
  local identifier="$1" password="$2"
  curl -s -X POST "${API}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"identifier\":\"${identifier}\",\"password\":\"${password}\"}"
}

echo "=== STAGE C flow tests ==="
echo "BASE_URL=${BASE_URL}"
echo ""

echo "--- Seed prerequisite: npm run seed (assumes demo users exist) ---"
echo ""

echo "--- 401: GET /bookings without token ---"
NOAUTH=$(curl -s -w "\nHTTP:%{http_code}" "${API}/bookings")
echo "$(echo "$NOAUTH" | sed '$d')" | jq .
echo "status: $(echo "$NOAUTH" | tail -1 | sed 's/HTTP://')"
echo ""

ADMIN_JSON=$(login "${ADMIN_IDENTIFIER}" "${ADMIN_PASSWORD}")
ADMIN_TOKEN=$(jq_val "$ADMIN_JSON" '.token')
if [[ "$ADMIN_TOKEN" == "null" || -z "$ADMIN_TOKEN" ]]; then
  echo "FAIL: admin login — use ADMIN_PHONE/ADMIN_PASSWORD from server/.env"
  echo "$ADMIN_JSON" | jq .
  exit 1
fi
echo "--- Admin login OK (${ADMIN_IDENTIFIER}) ---"

echo "--- POST /services (admin create) ---"
SERVICE_JSON=$(curl -s -X POST "${API}/services" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Stage C Test Service",
    "iconKey":"wrench",
    "basePrice":200,
    "shortDesc":"Flow test service",
    "stepTemplate":["Arrival","Before","After"]
  }')
echo "$SERVICE_JSON" | jq .
SERVICE_ID=$(jq_val "$SERVICE_JSON" '.service.id')
echo "SERVICE_ID=${SERVICE_ID}"
echo ""

CUST_JSON=$(login "9000000020" "cust123")
CUST_TOKEN=$(jq_val "$CUST_JSON" '.token')
echo "--- Customer login OK ---"

echo "--- POST /bookings (ANTIDOT100 coupon, server-computed total) ---"
BOOK_JSON=$(curl -s -X POST "${API}/bookings" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceId\":\"${SERVICE_ID}\",
    \"schedule\":{\"date\":\"2026-06-20\",\"slot\":\"10:00-12:00\"},
    \"address\":\"123 Test St, Austin TX\",
    \"paymentMethod\":\"upi_card\",
    \"couponCode\":\"ANTIDOT100\",
    \"problemPhotos\":[\"/uploads/sample.jpg\"]
  }")
echo "$BOOK_JSON" | jq '{id: .booking.id, status: .booking.status, amount: .booking.amount, steps: .booking.steps | length}'
BOOKING_ID=$(jq_val "$BOOK_JSON" '.booking.id')
BASE=$(jq_val "$BOOK_JSON" '.booking.amount.base')
GST=$(jq_val "$BOOK_JSON" '.booking.amount.gst')
COUPON=$(jq_val "$BOOK_JSON" '.booking.amount.coupon')
TOTAL=$(jq_val "$BOOK_JSON" '.booking.amount.total')
EXPECTED_TOTAL=$((BASE + GST - COUPON))
if [[ "$EXPECTED_TOTAL" -lt 0 ]]; then EXPECTED_TOTAL=0; fi
if [[ "$TOTAL" != "$EXPECTED_TOTAL" ]]; then
  echo "FAIL: total ${TOTAL} != expected ${EXPECTED_TOTAL} (base=${BASE} gst=${GST} coupon=${COUPON})"
  exit 1
fi
echo "amount check OK: base=${BASE} gst=${GST} coupon=${COUPON} total=${TOTAL}"
echo ""

TECH_JSON=$(login "9000000010" "tech123")
TECH_TOKEN=$(jq_val "$TECH_JSON" '.token')
TECH_ID=$(jq_val "$TECH_JSON" '.user.id')
echo "--- Technician login OK id=${TECH_ID} ---"

echo "--- PATCH /bookings/:id/assign (admin, ensure tech) ---"
curl -s -X PATCH "${API}/bookings/${BOOKING_ID}/assign" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"technicianId\":\"${TECH_ID}\"}" | jq '{status: .booking.status, technician: .booking.technicianId}'
echo ""

echo "--- Customer fetches start OTP ---"
START_OTP=$(curl -s "${API}/bookings/${BOOKING_ID}" \
  -H "Authorization: Bearer ${CUST_TOKEN}" | jq -r '.booking.workOtp.start.code')
echo "start OTP: ${START_OTP}"
if [[ -z "$START_OTP" || "$START_OTP" == "null" ]]; then
  echo "FAIL: customer did not receive start OTP"
  exit 1
fi
echo ""

echo "--- POST /bookings/:id/start-work (technician + OTP) ---"
curl -s -X POST "${API}/bookings/${BOOKING_ID}/start-work" \
  -H "Authorization: Bearer ${TECH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"otp\":\"${START_OTP}\"}" | jq '{status: .booking.status}'
echo ""

echo "--- 403: customer PATCH status (technician action) ---"
FORBIDDEN=$(curl -s -w "\nHTTP:%{http_code}" -X PATCH "${API}/bookings/${BOOKING_ID}/status" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}')
echo "$(echo "$FORBIDDEN" | sed '$d')" | jq .
echo "status: $(echo "$FORBIDDEN" | tail -1 | sed 's/HTTP://')"
echo ""

echo "--- Technician stats BEFORE review ---"
STATS_BEFORE=$(curl -s "${API}/stats/technician" -H "Authorization: Bearer ${TECH_TOKEN}")
echo "$STATS_BEFORE" | jq .
JOBS_BEFORE=$(jq_val "$STATS_BEFORE" '.jobsDone')
echo ""

STEP_COUNT=$(curl -s "${API}/bookings/${BOOKING_ID}" \
  -H "Authorization: Bearer ${TECH_TOKEN}" | jq '.booking.steps | length')

for ((i=0; i<STEP_COUNT; i++)); do
  echo "--- PATCH step ${i} → done (photoUrl + geo) ---"
  STEP_RES=$(curl -s -X PATCH "${API}/bookings/${BOOKING_ID}/steps/${i}" \
    -H "Authorization: Bearer ${TECH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\":\"done\",
      \"photoUrl\":\"/uploads/flow-step-${i}.jpg\",
      \"geo\":{\"lat\":30.2672,\"lng\":-97.7431,\"address\":\"123 Test St\"}
    }")
  echo "$STEP_RES" | jq "{step: ${i}, bookingStatus: .booking.status, stepStatus: .booking.steps[${i}].status}"
done
echo ""

STATUS=$(curl -s "${API}/bookings/${BOOKING_ID}" \
  -H "Authorization: Bearer ${TECH_TOKEN}" | jq -r '.booking.status')
echo "After steps, status=${STATUS}"
if [[ "$STATUS" != "awaiting_verification" ]]; then
  echo "FAIL: expected awaiting_verification, got ${STATUS}"
  exit 1
fi
echo ""

echo "--- Customer fetches end OTP ---"
END_OTP=$(curl -s "${API}/bookings/${BOOKING_ID}" \
  -H "Authorization: Bearer ${CUST_TOKEN}" | jq -r '.booking.workOtp.end.code')
echo "end OTP: ${END_OTP}"
if [[ -z "$END_OTP" || "$END_OTP" == "null" ]]; then
  echo "FAIL: customer did not receive end OTP"
  exit 1
fi
echo ""

echo "--- POST /complete-work (technician + end OTP) → completed ---"
VERIFY=$(curl -s -X POST "${API}/bookings/${BOOKING_ID}/complete-work" \
  -H "Authorization: Bearer ${TECH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"otp\":\"${END_OTP}\"}")
echo "$VERIFY" | jq '{status: .booking.status}'
if [[ "$(jq_val "$VERIFY" '.booking.status')" != "completed" ]]; then
  echo "FAIL: verify did not complete booking"
  exit 1
fi
echo ""

echo "--- POST /reviews ---"
REVIEW=$(curl -s -X POST "${API}/reviews" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"${BOOKING_ID}\",\"stars\":5,\"tags\":[\"on-time\",\"professional\"],\"comment\":\"Great job\"}")
echo "$REVIEW" | jq .
echo ""

echo "--- Technician stats AFTER review (jobsDone delta) ---"
STATS_AFTER=$(curl -s "${API}/stats/technician" -H "Authorization: Bearer ${TECH_TOKEN}")
echo "$STATS_AFTER" | jq .
JOBS_AFTER=$(jq_val "$STATS_AFTER" '.jobsDone')
if [[ "$JOBS_AFTER" -le "$JOBS_BEFORE" ]]; then
  echo "FAIL: jobsDone did not increase (${JOBS_BEFORE} -> ${JOBS_AFTER})"
  exit 1
fi
echo "jobsDone delta OK: ${JOBS_BEFORE} -> ${JOBS_AFTER}"
echo ""

echo "--- GET /reviews/booking/:id ---"
curl -s "${API}/reviews/booking/${BOOKING_ID}" | jq .
echo ""

echo "--- GET /offers (public) ---"
curl -s "${API}/offers" | jq '.offers | length'
echo ""

echo "--- Customer addresses ---"
ADDR_JSON=$(curl -s -X POST "${API}/addresses" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"label":"Test","line1":"99 Test Lane","city":"Mumbai","isDefault":true}')
echo "$ADDR_JSON" | jq '{id: .address.id, label: .address.label}'
ADDR_ID=$(jq_val "$ADDR_JSON" '.address.id')
LIST_ADDR=$(curl -s -H "Authorization: Bearer ${CUST_TOKEN}" "${API}/addresses")
echo "address count: $(echo "$LIST_ADDR" | jq '.addresses | length')"
echo ""

echo "--- Notifications after booking ---"
NOTIF=$(curl -s -H "Authorization: Bearer ${CUST_TOKEN}" "${API}/notifications")
echo "notifications: $(echo "$NOTIF" | jq '.notifications | length'), unread: $(echo "$NOTIF" | jq '.unreadCount')"
echo ""

echo "=== All Stage C flow checks passed ==="
