#!/bin/bash

# Test script to debug the booking API
# Run this in your terminal or copy the curl commands

echo "🔍 Testing Booking API on Production..."
echo "================================================"

# Get your auth token from browser localStorage
# Replace YOUR_TOKEN_HERE with your actual token
TOKEN="YOUR_TOKEN_HERE"

echo "1. Testing health endpoint..."
curl -X GET "https://auto-saaz-server.onrender.com/health" \
  -H "Content-Type: application/json"

echo -e "\n\n2. Testing bookings list endpoint..."
curl -X GET "https://auto-saaz-server.onrender.com/api/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\n3. Testing specific booking endpoint..."
curl -X GET "https://auto-saaz-server.onrender.com/api/bookings/BK17053188000001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\n4. Testing with UUID if available..."
# You'll need to replace UUID_HERE with an actual UUID from the database
curl -X GET "https://auto-saaz-server.onrender.com/api/bookings/UUID_HERE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\n✅ Test completed. Check responses above."