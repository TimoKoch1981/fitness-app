#!/bin/bash
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcxOTU4NTE2LCJleHAiOjIwODczMTg1MTZ9.XNDywUYckRkTSjDfQWINtPDRCT1fBCU29625KJtl8Os"
KONG_IP="172.18.0.3"

# Login
RESP=$(curl -s -X POST "http://$KONG_IP:8000/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fitbuddy.local","password":"test1234"}')

TOKEN=$(echo "$RESP" | grep -oP '"access_token":"[^"]*"' | cut -d'"' -f4)
USERID=$(echo "$RESP" | grep -oP '"sub":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "UserID: $USERID"
echo "Token length: ${#TOKEN}"

# Insert body measurement
echo "--- Insert Test ---"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "http://$KONG_IP:8000/rest/v1/body_measurements" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$USERID\",\"weight_kg\":105,\"body_fat_pct\":25,\"muscle_mass_kg\":40,\"water_pct\":55}"
