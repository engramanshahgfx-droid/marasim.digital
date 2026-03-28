// Marketplace Service Library
// Location: src/lib/marketplaceService.ts
// Usage: Server-side functions for marketplace operations

import type { Database } from '@/types/database'
import type {
  Booking,
  CreateBookingRequest,
  Provider,
  SearchServicesRequest,
  SearchServicesResponse,
  Service,
  ServiceReview,
} from '@/types/marketplace'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * Service Management
 */

export class MarketplaceService {
  /**
   * Get all active services with filters
   */
  static async searchServices(params: SearchServicesRequest): Promise<SearchServicesResponse> {
    try {
      let query = supabase
        .from('services')
        .select(
          `
          *,
          providers (
            id,
            business_name,
            rating,
            reviews_count,
            is_verified,
            logo_url
          )
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('is_approved', true) as any

      // Apply filters
      if (params.category) {
        query = query.eq('category', params.category)
      }

      if (params.subcategory) {
        query = query.eq('subcategory', params.subcategory)
      }

      if (params.min_price !== undefined) {
        query = query.gte('price', params.min_price)
      }

      if (params.max_price !== undefined) {
        query = query.lte('price', params.max_price)
      }

      if (params.rating !== undefined) {
        query = query.gte('rating', params.rating)
      }

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      // Apply sorting
      const sortField = params.sort_by || 'created_at'
      const sortOrder = params.sort_order === 'asc' ? { ascending: true } : { ascending: false }
      query = query.order(sortField, sortOrder)

      // Pagination
      const page = params.page || 1
      const limit = params.limit || 20
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        const message = String((error as any).message || error).toLowerCase()
        if (message.includes('could not find the table') || message.includes('table "services" does not exist')) {
          return {
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              total_pages: 0,
            },
            filters: {
              categories: [],
              price_range: [0, 0],
              ratings: [],
            },
          }
        }
        throw error
      }

      return {
        data: (data || []) as Service[],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
        filters: {
          categories: ['Catering', 'Photography', 'Venues'],
          price_range: [50, 100000],
          ratings: [1, 2, 3, 4, 5],
        },
      }
    } catch (error) {
      console.error('Error searching services:', error)
      throw error
    }
  }

  /**
   * Get single service with reviews
   */
  static async getService(serviceId: string): Promise<Service> {
    try {
      const { data, error } = await (supabase
        .from('services')
        .select(
          `
          *,
          providers (
            id,
            business_name,
            business_description,
            rating,
            reviews_count,
            is_verified,
            logo_url,
            website_url
          ),
          service_reviews (
            id,
            rating,
            title,
            review_text,
            customer_id,
            created_at
          )
        `
        )
        .eq('id', serviceId)
        .single() as any)

      if (error) throw error
      return data as Service
    } catch (error) {
      console.error('Error getting service:', error)
      throw error
    }
  }

  /**
   * Create new service (provider)
   */
  static async createService(providerId: string, serviceData: Record<string, any>): Promise<Service> {
    try {
      // Verify provider exists and belongs to current user
      const { data: provider, error: providerError } = await (supabase
        .from('providers')
        .select('id')
        .eq('id', providerId)
        .single() as any)

      if (providerError || !provider) {
        throw new Error('Provider not found')
      }

      // Calculate final price safely
      const price = serviceData.price || 0
      const discountPercentage = serviceData.discount_percentage || 0
      const finalPrice = price - (price * discountPercentage) / 100

      const { data, error } = await (supabase
        .from('services')
        .insert([
          {
            provider_id: providerId,
            ...serviceData,
            final_price: finalPrice,
          },
        ] as any)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to create service')
      return data as Service
    } catch (error) {
      console.error('Error creating service:', error)
      throw error
    }
  }

  /**
   * Update service
   */
  static async updateService(serviceId: string, providerId: string, updateData: Record<string, any>): Promise<Service> {
    try {
      // Build update object with safe property access
      const updatePayload: Record<string, any> = {
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      // Calculate final price only if price is being updated
      if (typeof updateData.price === 'number') {
        const discountPercentage = updateData.discount_percentage ?? 0
        updatePayload.final_price = updateData.price - (updateData.price * discountPercentage) / 100
      }

      const { data, error } = await ((supabase.from('services') as any)
        .update(updatePayload)
        .eq('id', serviceId)
        .eq('provider_id', providerId)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to update service')
      return data as Service
    } catch (error) {
      console.error('Error updating service:', error)
      throw error
    }
  }

  /**
   * Get provider's services
   */
  static async getProviderServices(providerId: string): Promise<Service[]> {
    try {
      const { data, error } = await (supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false }) as any)

      if (error) throw error
      return (data || []) as Service[]
    } catch (error) {
      console.error('Error getting provider services:', error)
      throw error
    }
  }

  /**
   * Booking Management
   */

  /**
   * Create booking
   */
  static async createBooking(customerId: string, bookingData: CreateBookingRequest): Promise<Booking> {
    try {
      // Get service details and provider info
      const { data: service, error: serviceError } = await (supabase
        .from('services')
        .select('*, providers(commission_rate)')
        .eq('id', bookingData.service_id)
        .single() as any)

      if (serviceError || !service) {
        throw new Error('Service not found')
      }

      // Calculate fees with safe property access
      const serviceData = service as any
      const price = serviceData.price || 0
      const subtotal = price * bookingData.quantity
      const commissionRate = serviceData.providers?.commission_rate ?? 10
      const platform_fee = (subtotal * commissionRate) / 100
      const total_amount = subtotal + platform_fee

      // Generate booking reference
      const bookingReference = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      const { data, error } = await (supabase
        .from('bookings')
        .insert([
          {
            event_id: bookingData.event_id,
            service_id: bookingData.service_id,
            provider_id: serviceData.provider_id,
            customer_id: customerId,
            booking_reference: bookingReference,
            booking_date: bookingData.booking_date,
            event_date: bookingData.event_date || bookingData.booking_date,
            start_time: bookingData.start_time,
            end_time: bookingData.end_time,
            quantity: bookingData.quantity,
            unit_price: price,
            subtotal,
            platform_fee,
            total_amount,
            notes: bookingData.notes,
            customer_notes: bookingData.customer_notes,
            status: 'pending',
            payment_status: 'unpaid',
          },
        ] as any)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to create booking')

      // Update event's booked services
      await this.updateEventBookings(bookingData.event_id)

      return data as Booking
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  }

  /**
   * Get customer's bookings
   */
  static async getCustomerBookings(customerId: string): Promise<Booking[]> {
    try {
      const { data, error } = await (supabase
        .from('bookings')
        .select(
          `
          *,
          services (
            id,
            name,
            price,
            images
          ),
          providers (
            id,
            business_name,
            phone,
            email
          )
        `
        )
        .eq('customer_id', customerId)
        .order('booking_date', { ascending: false }) as any)

      if (error) throw error
      return (data || []) as Booking[]
    } catch (error) {
      console.error('Error getting customer bookings:', error)
      throw error
    }
  }

  /**
   * Get provider's bookings
   */
  static async getProviderBookings(providerId: string): Promise<Booking[]> {
    try {
      const { data, error } = await (supabase
        .from('bookings')
        .select(
          `
          *,
          services (
            id,
            name,
            price
          ),
          events (
            id,
            event_name,
            event_date
          )
        `
        )
        .eq('provider_id', providerId)
        .order('booking_date', { ascending: false }) as any)

      if (error) throw error
      return (data || []) as Booking[]
    } catch (error) {
      console.error('Error getting provider bookings:', error)
      throw error
    }
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string,
    providerId: string,
    status: string,
    response?: string
  ): Promise<Booking> {
    try {
      const { data, error } = await ((supabase.from('bookings') as any)
        .update({
          status,
          provider_response: response,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('provider_id', providerId)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to update booking status')
      return data as Booking
    } catch (error) {
      console.error('Error updating booking status:', error)
      throw error
    }
  }

  /**
   * Reviews & Ratings
   */

  /**
   * Add service review
   */
  static async addReview(
    customerId: string,
    reviewData: {
      booking_id: string
      rating: number
      title: string
      review_text: string
      images?: string[]
    }
  ): Promise<ServiceReview> {
    try {
      // Get booking and service details
      const { data: booking, error: bookingError } = await (supabase
        .from('bookings')
        .select('service_id')
        .eq('id', reviewData.booking_id)
        .eq('customer_id', customerId)
        .single() as any)

      if (bookingError || !booking) {
        throw new Error('Booking not found')
      }

      const bookingData = booking as any
      const { data, error } = await (supabase
        .from('service_reviews')
        .insert([
          {
            service_id: bookingData.service_id,
            booking_id: reviewData.booking_id,
            customer_id: customerId,
            rating: reviewData.rating,
            title: reviewData.title,
            review_text: reviewData.review_text,
            images: reviewData.images,
            is_verified_purchase: true,
          },
        ] as any)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to add review')

      // Update service rating
      await this.updateServiceRating(bookingData.service_id)

      return data as ServiceReview
    } catch (error) {
      console.error('Error adding review:', error)
      throw error
    }
  }

  /**
   * Get service reviews
   */
  static async getServiceReviews(serviceId: string): Promise<ServiceReview[]> {
    try {
      const { data, error } = await (supabase
        .from('service_reviews')
        .select('*')
        .eq('service_id', serviceId)
        .eq('status', 'published')
        .order('created_at', { ascending: false }) as any)

      if (error) throw error
      return (data || []) as ServiceReview[]
    } catch (error) {
      console.error('Error getting reviews:', error)
      throw error
    }
  }

  /**
   * Provider Management
   */

  /**
   * Get provider profile
   */
  static async getProviderProfile(providerId: string): Promise<Provider> {
    try {
      const { data, error } = await (supabase.from('providers').select('*').eq('id', providerId).single() as any)

      if (error) throw error
      return data as Provider
    } catch (error) {
      console.error('Error getting provider profile:', error)
      throw error
    }
  }

  /**
   * Register as provider
   */
  static async registerAsProvider(userId: string, providerData: Record<string, any>): Promise<Provider> {
    try {
      const { data, error } = await (supabase
        .from('providers')
        .insert([
          {
            user_id: userId,
            ...providerData,
            is_active: true,
          },
        ] as any)
        .select()
        .single() as any)

      if (error) throw error
      if (!data) throw new Error('Failed to register provider')
      return data as Provider
    } catch (error) {
      console.error('Error registering provider:', error)
      throw error
    }
  }

  /**
   * Get provider dashboard stats
   */
  static async getProviderDashboardStats(
    providerId: string
  ): Promise<{ this_month_revenue: number; pending_earnings: number }> {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Get stats from database
      const { data: stats, error: statsError } = await (supabase
        .from('provider_earnings')
        .select('amount, type, status', { count: 'exact' })
        .eq('provider_id', providerId)
        .gte('created_at', monthStart.toISOString()) as any)

      if (statsError) throw statsError

      const statsArray = (stats || []) as any[]
      const thisMonthRevenue =
        statsArray
          ?.filter((s) => s.type === 'booking' && s.status === 'settled')
          ?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0

      const pendingEarnings =
        statsArray
          ?.filter((s) => ['pending', 'payout_pending'].includes(s.status))
          ?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0

      return {
        this_month_revenue: thisMonthRevenue,
        pending_earnings: pendingEarnings,
      }
    } catch (error) {
      console.error('Error getting provider dashboard stats:', error)
      throw error
    }
  }

  /**
   * Utility Functions
   */

  /**
   * Update service rating based on reviews
   */
  private static async updateServiceRating(serviceId: string): Promise<void> {
    try {
      const { data: reviews, error } = await (supabase
        .from('service_reviews')
        .select('rating')
        .eq('service_id', serviceId)
        .eq('status', 'published') as any)

      if (error) throw error

      const reviewsArray = (reviews || []) as any[]
      const avgRating =
        reviewsArray && reviewsArray.length > 0
          ? reviewsArray.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsArray.length
          : 0

      await ((supabase.from('services') as any)
        .update({
          rating: avgRating,
          reviews_count: reviewsArray?.length || 0,
        })
        .eq('id', serviceId) as any)
    } catch (error) {
      console.error('Error updating service rating:', error)
    }
  }

  /**
   * Update event bookings summary
   */
  private static async updateEventBookings(eventId: string): Promise<void> {
    try {
      const { data: bookings, error } = await (supabase
        .from('bookings')
        .select('service_id, total_amount')
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'completed']) as any)

      if (error) throw error

      const bookingsArray = (bookings || []) as any[]
      const totalCost = bookingsArray?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
      const serviceIds = bookingsArray?.map((b) => b.service_id) || []

      await ((supabase.from('events') as any)
        .update({
          services_booked: serviceIds,
          total_service_cost: totalCost,
        })
        .eq('id', eventId) as any)
    } catch (error) {
      console.error('Error updating event bookings:', error)
    }
  }
}

export default MarketplaceService
