import { personalizeInvitationData } from '@/lib/invitationPersonalization'
import { getInvitationByPublicLink } from '@/lib/invitationTemplateCompat'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

function escapeXml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function safeNumber(value: unknown, fallback: number) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function buildInvitationSvg(invitation: any) {
  const data = invitation.invitation_data || {}
  const customization = invitation.customization || {}
  const primary = invitation.customization?.primary_color || '#1d4ed8'
  const secondary = invitation.customization?.secondary_color || '#eff6ff'
  const accent = invitation.customization?.accent_color || '#0f172a'
  const backdropCss = customization.backdrop_css
  const svgBackground =
    typeof backdropCss === 'string' && backdropCss.trim() && !backdropCss.includes('gradient') ? backdropCss : secondary
  const headerLogoMode = customization?.header_logo?.mode
  const headerLogoUrl = customization?.header_logo?.custom_url
  const canvasItems = Array.isArray(customization?.canvas_items) ? customization.canvas_items : []

  const renderedCanvasItems = canvasItems
    .map((item: any) => {
      const x = safeNumber(item?.x, 320)
      const y = safeNumber(item?.y, 220)
      const scale = safeNumber(item?.scale, 1)
      const rotation = safeNumber(item?.rotation, 0)
      const color = String(item?.color || '#1f2937')

      if (item?.type === 'text' && item?.text) {
        return `<text x="${x}" y="${y}" text-anchor="middle" font-size="30" fill="${escapeXml(color)}" transform="rotate(${rotation} ${x} ${y}) scale(${scale})">${escapeXml(String(item.text))}</text>`
      }

      if (item?.type === 'logo' && item?.src) {
        const size = 120 * Math.max(scale, 0.4)
        return `<image href="${escapeXml(String(item.src))}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" transform="rotate(${rotation} ${x} ${y})" preserveAspectRatio="xMidYMid meet" />`
      }

      if (item?.type === 'sticker' && item?.stickerImageUrl) {
        const size = 110 * Math.max(scale, 0.4)
        return `<image href="${escapeXml(String(item.stickerImageUrl))}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" transform="rotate(${rotation} ${x} ${y})" preserveAspectRatio="xMidYMid meet" />`
      }

      return ''
    })
    .join('\n')

  const headerLogoMarkup =
    headerLogoMode === 'remove'
      ? ''
      : headerLogoMode === 'custom' && headerLogoUrl
        ? `<image href="${escapeXml(String(headerLogoUrl))}" x="515" y="72" width="170" height="44" preserveAspectRatio="xMidYMid meet" />`
        : `<text x="600" y="100" text-anchor="middle" font-size="20" font-family="Arial" fill="${escapeXml(primary)}" font-weight="700">PAPERLESS STYLE</text>`

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
      <rect width="1200" height="1600" fill="${escapeXml(svgBackground)}" />
      <rect x="60" y="60" width="1080" height="1480" rx="36" fill="white" stroke="${primary}" stroke-width="8" />
      ${headerLogoMarkup}
      <text x="600" y="220" text-anchor="middle" font-size="46" font-family="Arial" fill="${escapeXml(primary)}" font-weight="700">${escapeXml(String(data.event_name || 'Invitation'))}</text>
      <text x="600" y="310" text-anchor="middle" font-size="28" font-family="Arial" fill="${escapeXml(accent)}">${escapeXml(String(data.description || 'You are invited'))}</text>
      <text x="600" y="460" text-anchor="middle" font-size="26" font-family="Arial" fill="${escapeXml(accent)}">Date: ${escapeXml(String(data.date || 'TBD'))}</text>
      <text x="600" y="520" text-anchor="middle" font-size="26" font-family="Arial" fill="${escapeXml(accent)}">Time: ${escapeXml(String(data.time || '18:00'))}</text>
      <text x="600" y="580" text-anchor="middle" font-size="26" font-family="Arial" fill="${escapeXml(accent)}">Location: ${escapeXml(String(data.location || 'TBD'))}</text>
      <text x="600" y="720" text-anchor="middle" font-size="22" font-family="Arial" fill="${escapeXml(primary)}">Hosted by ${escapeXml(String(data.host_name || data.event_name || 'Event Host'))}</text>
      ${renderedCanvasItems}
    </svg>
  `.trim()
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ shareLink: string }> }) {
  try {
    const { shareLink } = await params
    const url = new URL(request.url)
    const guestId = url.searchParams.get('guestId') || url.searchParams.get('guest_id')
    const format = url.searchParams.get('format') || 'pdf'

    const invitation = await getInvitationByPublicLink(supabase as any, shareLink)
    let invitationForExport = invitation

    if (guestId) {
      const { data: guest } = await supabase
        .from('guests')
        .select('id, event_id, name, email, phone, notes, plus_ones, qr_token')
        .eq('id', guestId)
        .eq('event_id', invitation.event_id)
        .single()

      if (guest) {
        invitationForExport = {
          ...invitation,
          invitation_data: personalizeInvitationData(invitation.invitation_data, guest),
        }
      }
    }

    if (format === 'image') {
      const svg = buildInvitationSvg(invitationForExport)
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Disposition': `inline; filename="invitation-${shareLink}.svg"`,
          'Cache-Control': 'public, max-age=300',
        },
      })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const data = (invitationForExport as any).invitation_data || {}

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
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invitation-${shareLink}.pdf"`,
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (error) {
    console.error('Shared invitation export error:', error)
    return NextResponse.json({ error: 'Failed to export invitation' }, { status: 500 })
  }
}
