import { MarketplaceService } from '@/lib/marketplaceService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const { serviceId } = await params

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'Service ID required' }, { status: 400 })
    }

    const service = await MarketplaceService.getService(serviceId)

    return NextResponse.json({ success: true, data: service }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.toLowerCase().includes('not found') ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
