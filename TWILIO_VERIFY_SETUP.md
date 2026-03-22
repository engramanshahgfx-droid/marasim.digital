# Twilio Verify Integration Guide

Complete guide for implementing multi-channel OTP verification using Twilio Verify in your Marasim application.

## Overview

The application now supports:
- **Email-based OTP** using Resend email service
- **SMS verification** using Twilio Verify
- **WhatsApp verification** using Twilio Verify
- **Voice verification** using Twilio Verify
- **Multi-channel fallback** (try SMS, then WhatsApp, then voice)
- **Rate limiting** to prevent abuse
- **Security logging** for audit trails

## Setup Instructions

### 1. Twilio Account Setup

#### Create a Verify Service

1. Log in to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Verify → Services**
3. Click **Create new Service**
4. Name it "Marasim Verification" or similar
5. Copy the **Service SID** (starts with `VA...`)
6. Go to the service settings:
   - **Enabled Channels**: Enable SMS, WhatsApp, Email, Voice as needed
   - **Code Length**: Set to 6 digits (default)
   - **Expiration**: 15 minutes (recommended)
   - **Code Type**: Alphanumeric (for better security)

#### Get Your Credentials

1. Go to **Account → API Keys & Tokens**
2. Copy:
   - **Account SID** (AC...)
   - **Auth Token** (keep secure!)

#### Set Up Phone Numbers (for SMS/Voice)

1. Go to **Phone Numbers → Manage → Active Numbers**
2. Purchase or verify a phone number for your country
3. Copy the number in E.164 format (e.g., `+14155238886`)

#### Set Up WhatsApp Business (Optional)

For WhatsApp verification, you need:

1. **Sandbox Testing** (free):
   - Use `+14155238886` as sender
   - Users must join sandbox first
   - Send sandbox join code: "join {your-sandbox-code}"

2. **Production WhatsApp Business**:
   - Apply for WhatsApp Business API
   - Verify your business account
   - Configure approved WhatsApp sender

### 2. Environment Configuration

Update your `.env` file:

```env
# Twilio Verify Service
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Phone numbers (E.164 format)
TWILIO_PHONE_NUMBER=+14155238886

# WhatsApp (optional)
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_INVITATION_TEMPLATE_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Database Setup

Ensure your Supabase database has the required table for email OTP:

```sql
CREATE TABLE verification_codes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
```

## API Endpoints

### Send OTP

**Endpoint:** `POST /api/auth/send-otp`

Send verification code via email or phone.

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+966501234567",
  "channel": "auto",
  "method": "email"
}
```

**Parameters:**
- `email` (string, optional): User's email address
- `phone` (string, optional): User's phone number (any format, will be converted to E.164)
- `channel` (string, default: "auto"): Channel to use
  - `"auto"` - Twilio chooses best available
  - `"sms"` - SMS only
  - `"whatsapp"` - WhatsApp only
  - `"email"` - Email only
  - `"voice"` - Voice call
- `method` (string, default: "auto"): Force specific delivery method

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email.",
  "method": "email",
  "recipient": "user@example.com"
}
```

**Error Responses:**
```json
{
  "error": "Too many verification attempts. Please try again later.",
  "retryAfter": 300
}
```

**Rate Limits:**
- 5 requests per 15 minutes per email/phone/IP

### Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

Verify the code and create user account.

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+966501234567",
  "code": "123456",
  "fullName": "John Doe"
}
```

**Parameters:**
- `email` or `phone` (required): User's contact
- `code` (required): 4-8 digit code from verification message
- `fullName` (optional): User's full name

**Response:**
```json
{
  "success": true,
  "verified": true,
  "userId": "uuid-here",
  "tempPassword": "generated-uuid",
  "method": "email"
}
```

**Rate Limits:**
- 10 attempts per 30 minutes per email/phone/IP

### Resend OTP

**Endpoint:** `POST /api/auth/resend-otp`

Request a new code via different channel.

**Request:**
```json
{
  "phone": "+966501234567",
  "channel": "sms"
}
```

**Parameters:**
- `phone` (string): User's phone number
- `channel` (string): New channel
  - `"sms"`, `"whatsapp"`, `"voice"`, etc.

**Rate Limits:**
- 3 requests per 5 minutes per phone

## Code Examples

### Frontend - Send OTP

```typescript
// Using email
const response = await fetch('/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    method: 'email'
  })
});

const data = await response.json();
if (!response.ok) {
  console.error('Error:', data.error);
  // Handle retry-after header
  if (response.status === 429) {
    const retryAfter = data.retryAfter;
    console.log(`Wait ${retryAfter} seconds before retrying`);
  }
}
```

### Frontend - Verify OTP

```typescript
const response = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    code: userEnteredCode,
    fullName: 'John Doe'
  })
});

const data = await response.json();
if (data.success && data.verified) {
  // User created successfully
  const { userId, tempPassword } = data;
  // Store credentials and redirect to login
}
```

### Phone-based Verification

```typescript
// Send OTP via SMS
const response = await fetch('/api/auth/send-otp', {
  method: 'POST',
  body: JSON.stringify({
    phone: '+966501234567',
    channel: 'sms'
  })
});

// Verify SMS code
const verifyResponse = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  body: JSON.stringify({
    phone: '+966501234567',
    code: '123456'
  })
});
```

## Security Features

### Rate Limiting

Protects against brute force attacks:
- **Send OTP**: 5 attempts per 15 minutes
- **Verify OTP**: 10 attempts per 30 minutes
- **Resend OTP**: 3 attempts per 5 minutes

Rate limits use email/phone as identifier, not just IP.

### Input Validation

- Email format validation (RFC 5322)
- Phone number E.164 format validation
- OTP code format (4-8 digits)
- Max length sanitization
- HTML/script injection prevention

### Security Logging

All authentication events are logged with:
- Timestamp
- Event type (send, verify, rate-limit, etc.)
- Masked user identifier
- IP address (when available)
- User agent
- Success/failure status

### CSRF Protection

Use CSRF tokens in forms when deploying to production.

### HTTPS Only

- All authentication endpoints must be HTTPS in production
- API tokens should never be exposed client-side

## Troubleshooting

### "SMS channel not enabled"

**Error Code:** 60207

**Solution:**
1. Go to Twilio Verify Service settings
2. Ensure SMS is in "Enabled Channels"
3. Verify you have a phone number configured

### "Recipient is not joined to Twilio WhatsApp Sandbox"

**Error Code:** 60215

**Solution:**
1. Send "join {sandbox-code}" to `+14155238886` from recipient's WhatsApp
2. Wait for confirmation
3. Retry verification

### "Too many requests"

**Error Code:** 20429

**Solution:**
- Wait for the time indicated in `retryAfter` response header
- Implement exponential backoff in client

### Rate Limit Reached

**Error:** "Too many verification attempts"

**Solution:**
- Wait for the time indicated in the response
- Check HTTP `Retry-After` header
- Consider implementing user-friendly messaging

## Production Checklist

- [ ] Use production Twilio API credentials (not test)
- [ ] Enable HTTPS on all endpoints
- [ ] Configure CORS properly
- [ ] Use environment variables for all secrets
- [ ] Set up SMS/WhatsApp phone numbers through verification process
- [ ] Test all channels thoroughly
- [ ] Configure Twilio webhooks for delivery callbacks (optional)
- [ ] Set up monitoring and alerting for verification failures
- [ ] Review security logs regularly
- [ ] Implement rate limiting on frontend as well
- [ ] Conduct security audit
- [ ] Set up backup verification method

## Performance Optimization

### Caching

Consider caching:
- Verification service configuration
- Available channels for region
- Rate limit status (short TTL)

### Database Indexing

Ensure indexes exist:
```sql
CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
```

### Cleanup

Periodically clean up expired verification codes:
```sql
DELETE FROM verification_codes WHERE expires_at < NOW();
```

## Monitoring

### Key Metrics

- Verification success rate (target: >95%)
- Average verification time
- Rate limit violations (should be <1%)
- Failed channel attempts
- Cost per verification

### Logging

Monitor logs for:
- Authentication errors
- Rate limit hits
- Invalid input attempts
- Database errors

## References

- [Twilio Verify Documentation](https://www.twilio.com/docs/verify/api)
- [Verify Service Configuration](https://www.twilio.com/docs/verify/api/service-resource)
- [Phone Number Validation](https://www.twilio.com/docs/lookup/api)
- [Error Codes Reference](https://www.twilio.com/docs/verify/api/verification-checks#check-errors)

## Support

For issues or questions:
1. Check Twilio error codes in the reference above
2. Review application logs for detailed errors
3. Test with cURL or Postman
4. Contact Twilio support if API-related

## Migration from Old System

If migrating from `otpService.ts` (Supabase-only):

1. Keep email verification as-is (uses Supabase)
2. Add phone verification (new with Twilio Verify)
3. Implement rate limiting
4. Update frontend to conditionally show email/phone input
5. Test both paths thoroughly
6. Gradually migrate users

## Cost Estimation

Twilio Verify pricing (as of 2024):
- SMS: ~$0.007 per verification
- WhatsApp: ~$0.01 per verification
- Voice: ~$0.07 per call
- Email (Resend): ~$0.10 per email

For 1000 verifications/month:
- SMS + Resend: ~$110/month
- SMS + WhatsApp + Resend: ~$120/month
