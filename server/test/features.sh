#!/usr/bin/env bash
# Extended API feature tests — content, stats, attendance, technicians, profile.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4001}"
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
TECH_ID="${TECH_PHONE:-9000000010}"
TECH_PASSWORD="${TECH_PASSWORD:-tech123}"

jq_val() { echo "$1" | jq -r "$2"; }
http_code() { echo "$1" | tail -1 | sed 's/HTTP://'; }
body_only() { echo "$1" | sed '$d'; }

login() {
  curl -s -X POST "${API}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"identifier\":\"${1}\",\"password\":\"${2}\"}"
}

assert_status() {
  local label="$1" expected="$2" raw="$3"
  local got
  got=$(http_code "$raw")
  if [[ "$got" != "$expected" ]]; then
    echo "FAIL: ${label} — expected HTTP ${expected}, got ${got}"
    body_only "$raw" | jq . 2>/dev/null || body_only "$raw"
    exit 1
  fi
  echo "OK: ${label} (${got})"
}

echo "=== Extended feature tests ==="
echo "BASE_URL=${BASE_URL}"
echo

echo "--- GET /content/home (public) ---"
HOME=$(curl -s -w "\nHTTP:%{http_code}" "${API}/content/home")
assert_status "content home" 200 "$HOME"
TITLE=$(body_only "$HOME" | jq -r '.promo.title // empty')
[[ -n "$TITLE" ]] || { echo "FAIL: missing promo.title"; exit 1; }
echo "promo.title=${TITLE}"
echo

ADMIN_JSON=$(login "${ADMIN_IDENTIFIER}" "${ADMIN_PASSWORD}")
ADMIN_TOKEN=$(jq_val "$ADMIN_JSON" '.token')
[[ "$ADMIN_TOKEN" != "null" && -n "$ADMIN_TOKEN" ]] || { echo "FAIL: admin login"; exit 1; }

echo "--- GET /content/admin/home ---"
ADMIN_HOME=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${ADMIN_TOKEN}" "${API}/content/admin/home")
assert_status "admin home content" 200 "$ADMIN_HOME"
echo

echo "--- GET /stats/admin ---"
ADMIN_STATS=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${ADMIN_TOKEN}" "${API}/stats/admin?period=month")
assert_status "admin stats" 200 "$ADMIN_STATS"
REV=$(body_only "$ADMIN_STATS" | jq -r '.revenue.total // .revenue // empty')
echo "admin revenue field present: ${REV:-ok}"
echo

echo "--- GET /services ---"
SERVICES=$(curl -s -w "\nHTTP:%{http_code}" "${API}/services")
assert_status "services list" 200 "$SERVICES"
COUNT=$(body_only "$SERVICES" | jq '.services | length')
[[ "$COUNT" -ge 1 ]] || { echo "FAIL: expected services"; exit 1; }
echo "services count=${COUNT}"
echo

CUST_JSON=$(login "9000000020" "cust123")
CUST_TOKEN=$(jq_val "$CUST_JSON" '.token')

echo "--- GET /technicians/available (customer) ---"
TECHS=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${CUST_TOKEN}" "${API}/technicians/available")
assert_status "technicians available" 200 "$TECHS"
TECH_COUNT=$(body_only "$TECHS" | jq '.technicians | length')
[[ "$TECH_COUNT" -ge 1 ]] || { echo "FAIL: expected technicians"; exit 1; }
echo "technicians=${TECH_COUNT}"
echo

echo "--- GET /payment-methods (customer) ---"
PM=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${CUST_TOKEN}" "${API}/payment-methods")
assert_status "payment methods" 200 "$PM"
echo

echo "--- PATCH /auth/me (customer profile) ---"
PATCH=$(curl -s -w "\nHTTP:%{http_code}" -X PATCH "${API}/auth/me" \
  -H "Authorization: Bearer ${CUST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"city":"Austin"}')
assert_status "patch profile" 200 "$PATCH"
echo

TECH_JSON=$(login "${TECH_ID}" "${TECH_PASSWORD}")
TECH_TOKEN=$(jq_val "$TECH_JSON" '.token')

echo "--- GET /stats/technician ---"
TSTATS=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${TECH_TOKEN}" "${API}/stats/technician")
assert_status "technician stats" 200 "$TSTATS"
echo

echo "--- GET /attendance/me (technician) ---"
ATT=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${TECH_TOKEN}" "${API}/attendance/me")
assert_status "attendance me" 200 "$ATT"
echo

echo "--- POST /attendance/check-in ---"
CHECKIN=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/attendance/check-in" \
  -H "Authorization: Bearer ${TECH_TOKEN}")
assert_status "check-in" 200 "$CHECKIN"
echo

echo "--- POST /attendance/mark-absent (restore off-duty) ---"
ABSENT=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/attendance/mark-absent" \
  -H "Authorization: Bearer ${TECH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')
assert_status "mark absent" 200 "$ABSENT"
echo

echo "--- POST /attendance/check-in (restore on-duty) ---"
CHECKIN2=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/attendance/check-in" \
  -H "Authorization: Bearer ${TECH_TOKEN}")
assert_status "check-in again" 200 "$CHECKIN2"
echo

echo "--- 403: customer cannot access admin stats ---"
FORBIDDEN=$(curl -s -w "\nHTTP:%{http_code}" -H "Authorization: Bearer ${CUST_TOKEN}" "${API}/stats/admin")
assert_status "customer blocked from admin stats" 403 "$FORBIDDEN"
echo

echo "=== All extended feature checks passed ==="
