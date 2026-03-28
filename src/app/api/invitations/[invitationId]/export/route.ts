import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function buildInvitationSvg(invitation: any) {
  const data = invitation.invitation_data || {}
  const primary = invitation.customization?.primary_color || '#1d4ed8'
  const secondary = invitation.customization?.secondary_color || '#eff6ff'
  const accent = invitation.customization?.accent_color || '#0f172a'

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <rect width="1200" height="1600" fill="${secondary}" />
      <rect x="60" y="60" width="1080" height="1480" rx="36" fill="white" stroke="${primary}" stroke-width="8" />
      <text x="600" y="220" text-anchor="middle" font-size="46" font-family="Arial" fill="${primary}" font-weight="700">${String(data.event_name || 'Invitation')}</text>
      <text x="600" y="310" text-anchor="middle" font-size="28" font-family="Arial" fill="${accent}">${String(data.description || 'You are invited')}</text>
      <text x="600" y="460" text-anchor="middle" font-size="26" font-family="Arial" fill="${accent}">Date: ${String(data.date || 'TBD')}</text>
      <text x="600" y="520" text-anchor="middle" font-size="26" font-family="Arial" fill="${accent}">Time: ${String(data.time || '18:00')}</text>
      <text x="600" y="580" text-anchor="middle" font-size="26" font-family="Arial" fill="${accent}">Location: ${String(data.location || 'TBD')}</text>
      <text x="600" y="720" text-anchor="middle" font-size="22" font-family="Arial" fill="${primary}">Hosted by ${String(data.host_name || data.event_name || 'Event Host')}</text>
    </svg>
  `.trim()
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invitationId } = await params
    const { format = 'pdf' } = await request.json().catch(() => ({ format: 'pdf' }))

    const { data: invitation, error } = await supabase
      .from('invitation_templates')
      .select('*')
      .eq('id', invitationId)
      .eq('created_by', user.id)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found or access denied' }, { status: 404 })
    }

    if (format === 'image') {
      const svg = buildInvitationSvg(invitation)
      await supabase
        .from('invitation_templates')
        .update({
          exported_formats: [
            'image',
            ...((invitation as any).exported_formats || []).filter((item: string) => item !== 'image'),
          ],
        })
        .eq('id', invitationId)

      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="invitation-${invitationId}.svg"`,
        },
      })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const data = (invitation as any).invitation_data || {}

    page.drawRectangle({
      x: 36,
      y: 36,
      width: 523.28,
      height: 769.89,
      borderColor: rgb(0.11, 0.31, 0.85),
      borderWidth: 2,
    })
    page.drawText(String(data.event_name || 'Invitation'), {
      x: 72,
      y: 740,
      size: 24,
      font: titleFont,
      color: rgb(0.11, 0.31, 0.85),
    })
    page.drawText(String(data.description || 'You are invited'), {
      x: 72,
      y: 700,
      size: 14,
      font: bodyFont,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: 440,
    })
    page.drawText(`Date: ${String(data.date || 'TBD')}`, { x: 72, y: 640, size: 14, font: bodyFont })
    page.drawText(`Time: ${String(data.time || '18:00')}`, { x: 72, y: 615, size: 14, font: bodyFont })
    page.drawText(`Location: ${String(data.location || 'TBD')}`, {
      x: 72,
      y: 590,
      size: 14,
      font: bodyFont,
      maxWidth: 440,
    })
    page.drawText(`Host: ${String(data.host_name || data.event_name || 'Event Host')}`, {
      x: 72,
      y: 555,
      size: 14,
      font: bodyFont,
      maxWidth: 440,
    })

    const pdfBytes = await pdfDoc.save()
    await supabase
      .from('invitation_templates')
      .update({
        exported_formats: [
          'pdf',
          ...((invitation as any).exported_formats || []).filter((item: string) => item !== 'pdf'),
        ],
      })
      .eq('id', invitationId)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invitation-${invitationId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Invitation export error:', error)
    return NextResponse.json({ error: 'Failed to export invitation' }, { status: 500 })
  }
}
