import { MarketplaceService } from '@/lib/marketplaceService'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data, error: verifyError } = await supabase.auth.getUser(token)

    if (verifyError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = data.user

    const body = await request.json()

    // Validate required fields
    const { business_name, email, phone, category, business_description } = body

    if (!business_name || !email || !phone || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'business_name, email, phone, and category are required',
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      )
    }

    // Validate phone format (basic E.164)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone format',
        },
        { status: 400 }
      )
    }

    // Check if user is already a provider
    const { data: existingProvider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()

    if (existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already registered',
          message: 'You are already registered as a provider',
        },
        { status: 409 }
      )
    }

    // Register as provider
    const provider = await MarketplaceService.registerAsProvider(user.id, {
      business_name: business_name.trim(),
      business_name_ar: body.business_name_ar?.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.replace(/[\s-()]/g, ''),
      category: category.trim(),
      category_ar: body.category_ar?.trim(),
      business_description: business_description?.trim(),
      business_description_ar: body.business_description_ar?.trim(),
      website_url: body.website_url?.trim(),
      social_media: {
        instagram: body.instagram?.trim(),
        tiktok: body.tiktok?.trim(),
        facebook: body.facebook?.trim(),
        linkedin: body.linkedin?.trim(),
      },
      business_license: body.business_license?.trim(),
    })

    return NextResponse.json(
      {
        success: true,
        data: provider,
        message: 'Provider registration successful',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Provider registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register provider',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT endpoint: Update provider profile
 * Usage: PUT /api/marketplace/providers/register
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data, error: verifyError } = await supabase.auth.getUser(token)

    if (verifyError || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = data.user

    const body = await request.json()

    // Get provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Update provider
    const { data: updatedProvider, error: updateError } = await supabase
      .from('providers')
      .update({
        business_name: body.business_name?.trim(),
        business_name_ar: body.business_name_ar?.trim(),
        business_description: body.business_description?.trim(),
        business_description_ar: body.business_description_ar?.trim(),
        website_url: body.website_url?.trim(),
        logo_url: body.logo_url?.trim(),
        cover_image_url: body.cover_image_url?.trim(),
        social_media: {
          instagram: body.instagram?.trim(),
          tiktok: body.tiktok?.trim(),
          facebook: body.facebook?.trim(),
          linkedin: body.linkedin?.trim(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(
      {
        success: true,
        data: updatedProvider,
        message: 'Provider updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Provider update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update provider',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
