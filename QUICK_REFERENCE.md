# Quick Reference - Twilio Verify Integration

## Environment Variables
```env
# Required for Twilio Verify
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Phone numbers (E.164 format, optional)
TWILIO_PHONE_NUMBER=+14155238886
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## API Endpoints

### Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+966501234567",
  "channel": "auto",
  "method": "email"
}
```

**Channels:** `auto`, `sms`, `whatsapp`, `email`, `voice`

### Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+966501234567",
  "code": "123456",
  "fullName": "John Doe"
}
```

### Resend OTP
```bash
POST /api/auth/resend-otp
Content-Type: application/json

{
  "phone": "+966501234567",
  "channel": "sms"
}
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| send-otp | 5 | 15 min |
| verify-otp | 10 | 30 min |
| resend-otp | 3 | 5 min |

**Response:** `429 Too Many Requests` with `Retry-After` header

## Import Services

```typescript
import { 
  sendVerification, 
  checkVerification,
  resendVerification,
  getVerifyErrorMessage 
} from '@/lib/verifyService'

import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  isValidEmail,
  isValidPhoneFormat
} from '@/lib/authSecurity'
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 20429 | Rate limited | Wait for Retry-After |
| 60203 | Invalid phone format | Use E.164 format |
| 60207 | SMS channel disabled | Enable in Twilio console |
| 60214 | Invalid code | Check user input |
| 60217 | Too many attempts | Request new code |
| 60219 | Code expired | Request new code |

## Testing

### Test Email
```json
{
  "email": "test@example.com",
  "method": "email"
}
```

### Test SMS (with Twilio test credentials)
```json
{
  "phone": "+14155238886",
  "channel": "sms"
}
```

### Test WhatsApp Sandbox
1. Send "join {sandbox-code}" to +14155238886
2. Then use phone in request:
```json
{
  "phone": "+1234567890",
  "channel": "whatsapp"
}
```

## Common Issues

**"SMS channel not enabled"**
→ Enable SMS in Twilio Verify Service settings

**"Recipient is not joined to Twilio WhatsApp Sandbox"**
→ Send "join {code}" to +14155238886 first

**"Too many requests"**
→ Wait for Retry-After seconds before retrying

**"Invalid phone format"**
→ Use E.164 format: +{country-code}{number}
→ Example: +966501234567 (Saudi Arabia)

## File Locations

- Service: `src/lib/verifyService.ts`
- Security: `src/lib/authSecurity.ts`
- Send OTP: `src/app/api/auth/send-otp/route.ts`
- Verify OTP: `src/app/api/auth/verify-otp/route.ts`
- Resend OTP: `src/app/api/auth/resend-otp/route.ts`

## Documentation

- `TWILIO_VERIFY_SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `.env.example` - Required environment variables

## Support

1. Check `TWILIO_VERIFY_SETUP.md` troubleshooting section
2. Review error codes and logs
3. Test with Twilio console
4. Verify environment variables are set

---

**Last Updated:** March 17, 2026
