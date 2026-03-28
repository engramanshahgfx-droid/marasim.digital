// Example API Endpoint: Search Services
// Location: src/app/api/marketplace/services/search/route.ts
// Method: GET
// Usage: GET /api/marketplace/services/search?category=catering&minPrice=100&maxPrice=1000

import { MarketplaceService } from '@/lib/marketplaceService'
import type { SearchServicesRequest } from '@/types/marketplace'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams

    const params: SearchServicesRequest = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      min_price: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      max_price: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined,
      availability_date: searchParams.get('availabilityDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
      sort_by: (searchParams.get('sortBy') as any) || 'created_at',
      sort_order: (searchParams.get('sortOrder') as any) || 'desc',
    }

    // Validate page and limit
    if (params.page! < 1) params.page = 1
    if (params.limit! < 1 || params.limit! > 100) params.limit = 20

    const result = await MarketplaceService.searchServices(params)

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
        filters: result.filters,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Search services error:', error)
    const message =
      error instanceof Error ? error.message : typeof error === 'object' ? JSON.stringify(error) : String(error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search services',
        message,
      },
      { status: 500 }
    )
  }
}
