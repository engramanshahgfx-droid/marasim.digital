# WhatsApp Delivery Troubleshooting

## Common Issues & Solutions

### ❌ "Recipient is not joined to Twilio WhatsApp Sandbox"

**What it means:** The recipient hasn't registered with Twilio's sandbox yet.

**How to fix:**
1. Recipient sends to **+14155238886**: `join {sandbox-code}`
2. Wait 1-2 minutes for confirmation
3. Retry sending invitation
4. Should deliver within a few minutes

**Get your sandbox code:**
- Twilio Console → Verify → Your Service → WhatsApp tab
- Look for "Sandbox Recipient Join Code"

---

### ❌ "SMS pumping fraud detected" (Error 63020)

**What it means:** Twilio blocked the message as potential SMS pumping attack.

**How to fix:**
1. Use a verified WhatsApp Business Account (production)
2. Or contact Twilio support to whitelist your number
3. Avoid sending to many numbers in short time (slower send rate)

---

### ⏳ "Pending" Status (No delivery notification)

**What it means:** Message queued but not yet delivered.

**Common reasons:**
- Recipient on Sandbox but not responded to first message yet
- Twilio experiencing delays (check status page)
- Recipient's WhatsApp not connected

**What to do:**
- Wait 5-15 minutes for delivery
- Check recipient's phone WhatsApp is active
- If still pending after 1 hour, try resending

---

### ❌ "Invalid phone number"

**What it means:** Phone number format is wrong.

**How to fix:**
- Use E.164 format: `+{country-code}{number}`
- Examples:
  - Saudi Arabia: `+966501234567`
  - Pakistan: `+923409557583`
  - USA: `+14155238886`
- Remove spaces, dashes, parentheses

---

### ❌ "Message queue limit exceeded"

**What it means:** Sending too many messages too fast.

**How to fix:**
- Slow down send rate
- Send in batches (10-15 per minute)
- Add 2-3 second delays between sends

---

## Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|-----------|
| Cost | Free | ~$0.01 per message |
| Sender Number | +14155238886 | Your verified business number |
| Recipients | Must explicitly join | All can receive |
| Template Messages | Not required | Pre-approved templates |
| Speed | Instant to 5 min | Usually instant |
| Use Case | Testing/Development | Live business |

---

## Steps to Move to Production

1. **Get WhatsApp Business Account**
   - Register at WhatsApp Business
   - Verify your business
   - Get assigned a phone number

2. **Update Twilio Configuration**
   - Update `TWILIO_WHATSAPP_NUMBER` to your business number
   - Set up message templates in Twilio

3. **Update Environment**
   ```env
   TWILIO_WHATSAPP_NUMBER=+1234567890  # Your business number
   TWILIO_INVITATION_TEMPLATE_SID=HX...  # Approved template
   ```

4. **No More Sandbox**
   - Recipients don't need to join anything
   - Messages deliver to any valid WhatsApp number
   - Remove sandbox helper UI

---

## Current Status (Your App)

✅ **Sandbox Mode Active**
- Sender: +14155238886
- Good for testing
- Messages working correctly

**Next steps:**
1. Have recipients join sandbox first
2. Test message delivery
3. When ready, switch to production WhatsApp account

---

## Why Your Message Failed

**Your situation:**
- Recipient: +923409557583 (Pakistan)
- Status: ❌ Failed
- Reason: Not in sandbox

**To fix:**
1. Tell recipient to send `join {sandbox-code}` to +14155238886
2. Wait for "You are confirmed" reply
3. Retry sending invitation
4. Done! ✅

---

## Debugging in Twilio Console

1. Go to **Twilio Console** → **Messaging** → **Messages**
2. Find the failed message
3. Click to see full error details
4. Check error code against guide above
5. Take appropriate action

---

## Rate Limits to Avoid

- Don't send >60 messages/minute per account
- Don't send >10 to same recipient/hour
- Don't send to unverified numbers
- Don't spam with duplicate messages

---

## Support

**Quick fixes:**
1. Check phone format is E.164
2. Verify recipient joined sandbox (if sandbox)
3. Wait a few minutes for delivery
4. Check Twilio console for error details

**Still not working?**
1. Share Twilio message SID (not phone number)
2. Include error code and timestamp
3. Contact Twilio support with this info

---

**Last Updated:** March 18, 2026
