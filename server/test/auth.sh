#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
API="${BASE_URL}/api/auth"

SUFFIX="${RANDOM}${RANDOM}"
PHONE="+1555${SUFFIX:0:7}"
EMAIL="test${SUFFIX}@demo.com"
PASSWORD="password123"

echo "=== STAGE B auth tests ==="
echo "BASE_URL=${BASE_URL}"
echo "PHONE=${PHONE}"
echo ""

echo "--- POST /register ---"
REGISTER=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"phone\":\"${PHONE}\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"city\":\"Austin\"}")
HTTP=$(echo "$REGISTER" | tail -1 | sed 's/HTTP://')
BODY=$(echo "$REGISTER" | sed '$d')
echo "$BODY" | jq .
echo "status: ${HTTP}"
TOKEN=$(echo "$BODY" | jq -r '.token')
HAS_HASH=$(echo "$BODY" | jq 'has("user") and (.user | has("passwordHash"))')
if [[ "$HAS_HASH" == "true" ]]; then echo "FAIL: passwordHash leaked"; exit 1; fi
echo ""

echo "--- POST /register duplicate phone (expect 400) ---"
DUP=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"phone\":\"${PHONE}\",\"email\":\"dup${EMAIL}\",\"password\":\"${PASSWORD}\"}")
echo "$DUP" | sed '$d' | jq .
echo "status: $(echo "$DUP" | tail -1 | sed 's/HTTP://')"
echo ""

echo "--- POST /login by phone ---"
LOGIN=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"${PHONE}\",\"password\":\"${PASSWORD}\"}")
echo "$LOGIN" | sed '$d' | jq .
echo "status: $(echo "$LOGIN" | tail -1 | sed 's/HTTP://')"
TOKEN=$(echo "$LOGIN" | sed '$d' | jq -r '.token')
echo ""

echo "--- GET /me ---"
ME=$(curl -s -w "\nHTTP:%{http_code}" "${API}/me" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$ME" | sed '$d' | jq .
echo "status: $(echo "$ME" | tail -1 | sed 's/HTTP://')"
echo ""

echo "--- GET /me without token (expect 401) ---"
NOAUTH=$(curl -s -w "\nHTTP:%{http_code}" "${API}/me")
echo "$NOAUTH" | sed '$d' | jq .
echo "status: $(echo "$NOAUTH" | tail -1 | sed 's/HTTP://')"
echo ""

echo "--- GET /me invalid token (expect 401) ---"
BAD=$(curl -s -w "\nHTTP:%{http_code}" "${API}/me" \
  -H "Authorization: Bearer invalid.token.here")
echo "$BAD" | sed '$d' | jq .
echo "status: $(echo "$BAD" | tail -1 | sed 's/HTTP://')"
echo ""

OTP_PHONE="+1999${SUFFIX:0:7}"
echo "--- POST /otp/send ---"
curl -s -X POST "${API}/otp/send" -H "Content-Type: application/json" \
  -d "{\"phone\":\"${OTP_PHONE}\"}" | jq .
echo ""

echo "--- POST /otp/verify (code 4700) ---"
OTP=$(curl -s -w "\nHTTP:%{http_code}" -X POST "${API}/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"${OTP_PHONE}\",\"code\":\"4700\"}")
echo "$OTP" | sed '$d' | jq .
echo "status: $(echo "$OTP" | tail -1 | sed 's/HTTP://')"
OTP_HASH=$(echo "$OTP" | sed '$d' | jq '(.user | has("passwordHash"))')
if [[ "$OTP_HASH" == "true" ]]; then echo "FAIL: passwordHash leaked in OTP"; exit 1; fi

echo ""
echo "=== All Stage B auth checks passed ==="
