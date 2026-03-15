interface EmailTemplateProps {
  firstName: string
  otpCode: string
}

export function EmailTemplate({ firstName, otpCode }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#111827', lineHeight: 1.5 }}>
      <h1 style={{ margin: '0 0 12px' }}>Welcome, {firstName}!</h1>
      <p style={{ margin: '0 0 12px' }}>Use this one-time code to complete your Marasim registration:</p>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '6px',
          margin: '16px 0',
        }}
      >
        {otpCode}
      </div>
      <p style={{ margin: '0 0 8px' }}>This code expires in 15 minutes.</p>
      <p style={{ margin: 0, color: '#6b7280' }}>If you did not request this code, you can ignore this email.</p>
    </div>
  )
}
