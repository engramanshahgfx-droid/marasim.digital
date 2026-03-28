// Marketplace Types for the Event Management Platform

// Service Categories
export interface ServiceCategory {
  id: string
  name: string
  name_ar: string
  description?: string
  description_ar?: string
  icon?: string
  icon_color?: string
  parent_category_id?: string
  display_order: number
  is_active: boolean
  created_at: string
}

// Provider Profile
export interface Provider {
  id: string
  user_id: string
  business_name: string
  business_name_ar?: string
  business_description?: string
  business_description_ar?: string
  category: string
  category_ar?: string
  phone: string
  email: string
  business_license?: string
  logo_url?: string
  cover_image_url?: string
  website_url?: string
  social_media?: {
    instagram?: string
    tiktok?: string
    facebook?: string
    linkedin?: string
  }
  rating: number
  reviews_count: number
  is_verified: boolean
  verified_at?: string
  is_featured: boolean
  featured_until?: string
  commission_rate: number
  bank_account_verified: boolean
  stripe_connect_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProviderProfile extends Provider {
  services_count?: number
  total_bookings?: number
  total_revenue?: number
}

// Service
export interface Service {
  id: string
  provider_id: string
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  category: string
  category_ar?: string
  subcategory?: string
  subcategory_ar?: string
  price: number
  price_currency: string
  discount_percentage?: number
  final_price: number
  images: ServiceImage[]
  features?: ServiceFeature[]
  duration_value?: number
  duration_unit?: string // 'hours', 'days', 'packages'
  max_bookings_per_month?: number
  current_bookings_this_month: number
  rating: number
  reviews_count: number
  availability: ServiceAvailability
  blackout_dates?: string[]
  is_active: boolean
  is_approved: boolean
  published_at?: string
  created_at: string
  updated_at: string
  providers?: Provider | null
}

export interface ServiceImage {
  url: string
  caption?: string
  order?: number
}

export interface ServiceFeature {
  name: string
  value: string
}

export interface ServiceAvailability {
  monday?: DayAvailability
  tuesday?: DayAvailability
  wednesday?: DayAvailability
  thursday?: DayAvailability
  friday?: DayAvailability
  saturday?: DayAvailability
  sunday?: DayAvailability
}

export interface DayAvailability {
  available: boolean
  start?: string // '09:00'
  end?: string // '18:00'
}

// Booking
export interface Booking {
  id: string
  event_id: string
  service_id: string
  provider_id: string
  customer_id: string
  booking_reference: string
  booking_date: string
  event_date?: string
  start_time?: string
  end_time?: string
  quantity: number
  unit_price: number
  subtotal: number
  discount_amount?: number
  platform_fee: number
  tax_amount?: number
  total_amount: number
  status: BookingStatus
  payment_status: PaymentStatus
  notes?: string
  customer_notes?: string
  provider_response?: string
  cancellation_reason?: string
  cancellation_requested_at?: string
  cancelled_at?: string
  refund_amount?: number
  refund_reason?: string
  refunded_at?: string
  stripe_payment_intent_id?: string
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'deposit_paid'

// Service Review
export interface ServiceReview {
  id: string
  service_id: string
  booking_id?: string
  customer_id: string
  rating: number
  title: string
  review_text: string
  images?: string[]
  is_verified_purchase: boolean
  helpful_count: number
  unhelpful_count: number
  provider_response?: string
  provider_response_at?: string
  status: 'draft' | 'pending' | 'published' | 'hidden'
  created_at: string
  updated_at: string
}

// Marketplace Settings
export interface MarketplaceSettings {
  id: string
  platform_commission_rate: number
  minimum_service_price: number
  maximum_service_price: number
  featured_listing_7d_price: number
  featured_listing_14d_price: number
  featured_listing_30d_price: number
  featured_listing_90d_price: number
  provider_verification_required: boolean
  require_service_approval: boolean
  max_service_images: number
  storage_limit_gb: number
  updated_at: string
}

// Featured Listing
export interface FeaturedListing {
  id: string
  provider_id: string
  service_id?: string
  duration_days: number
  price: number
  started_at: string
  expires_at: string
  status: 'active' | 'expired' | 'cancelled'
  cancelled_at?: string
  cancellation_reason?: string
}

// Provider Earnings
export interface ProviderEarnings {
  id: string
  provider_id: string
  booking_id?: string
  featured_listing_id?: string
  amount: number
  type: 'booking' | 'featured_listing' | 'refund'
  status: 'pending' | 'completed' | 'payout_pending' | 'settled'
  description?: string
  payout_date?: string
  created_at: string
}

// API Request/Response Types
export interface CreateServiceRequest {
  name: string
  name_ar?: string
  description: string
  description_ar?: string
  category: string
  subcategory?: string
  price: number
  discount_percentage?: number
  images: ServiceImage[]
  features?: ServiceFeature[]
  duration_value?: number
  duration_unit?: string
  max_bookings_per_month?: number
  availability: ServiceAvailability
  blackout_dates?: string[]
}

export interface CreateBookingRequest {
  event_id: string
  service_id: string
  booking_date: string
  event_date?: string
  start_time?: string
  end_time?: string
  quantity: number
  notes?: string
  customer_notes?: string
}

export interface SearchServicesRequest {
  category?: string
  subcategory?: string
  min_price?: number
  max_price?: number
  rating?: number
  availability_date?: string
  provider_id?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: 'price' | 'rating' | 'newest' | 'popularity'
  sort_order?: 'asc' | 'desc'
}

export interface SearchServicesResponse {
  data: Service[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  filters: {
    categories: string[]
    price_range: [number, number]
    ratings: number[]
  }
}

export interface CreateReviewRequest {
  booking_id: string
  rating: number // 1-5
  title: string
  review_text: string
  images?: string[]
}

// Service Statistics
export interface ServiceStats {
  id: string
  provider_id: string
  total_bookings: number
  total_reviews: number
  avg_rating: number
  total_revenue: number
  last_booking_date?: string
}

// Provider Statistics
export interface ProviderStats extends ProviderProfile {
  total_bookings_all_time: number
  total_revenue_all_time: number
  pending_payouts: number
  completed_payouts: number
  this_month_revenue: number
  this_month_bookings: number
  average_review_rating: number
  response_time_hours?: number
}

// Dashboard Data
export interface ProviderDashboardData {
  stats: ProviderStats
  recent_bookings: Booking[]
  recent_reviews: ServiceReview[]
  earnings_this_month: number
  pending_earnings: number
  active_services: Service[]
  upcoming_events: Array<{ event_date: string; booking_count: number }>
}

export interface CustomerDashboardData {
  stats: {
    total_events: number
    total_bookings: number
    total_spent: number
    upcoming_events: number
  }
  upcoming_events: Array<any> // Event type
  active_bookings: Booking[]
  past_bookings: Booking[]
  saved_services?: string[] // Service IDs
}

// Admin Types
export interface AdminMarketplaceStats {
  total_providers: number
  verified_providers: number
  total_services: number
  total_bookings: number
  total_revenue: number
  platform_earnings: number
  pending_reviews: number
}

export interface AdminProviderRequest {
  provider_id: string
  action: 'verify' | 'reject' | 'suspend' | 'unsuspend'
  reason?: string
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

// Error Response
export interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Success Response
export interface SuccessResponse<T> {
  success: boolean
  data: T
  message?: string
}

// Booking Confirmation Details
export interface BookingConfirmation {
  booking_id: string
  booking_reference: string
  service_name: string
  provider_name: string
  provider_contact: string
  booking_date: string
  total_amount: number
  payment_status: PaymentStatus
  next_steps?: string[]
}

// Shopping Cart Types
export interface CartItem {
  id: string
  guest_id: string
  event_id: string
  service_id: string
  service?: Service
  quantity: number
  unit_price: number
  notes?: string
  added_at: string
  updated_at: string
}

export interface Cart {
  items: CartItem[]
  event_id: string
  guest_id: string
  subtotal: number
  tax_amount: number
  platform_fee: number
  discount_amount: number
  total: number
  item_count: number
}

export interface AddToCartRequest {
  service_id: string
  quantity: number
  notes?: string
}

export interface UpdateCartItemRequest {
  quantity?: number
  notes?: string
}

// Bulk Order Types
export interface BulkOrder {
  id: string
  event_id: string
  customer_id: string
  order_number: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  subtotal: number
  discount_amount: number
  platform_fee: number
  tax_amount: number
  total_amount: number
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'partial_refund' | 'pending_verification' | 'rejected'
  payment_method?: string
  stripe_payment_intent_id?: string
  bank_reference_code?: string
  proof_image_url?: string
  proof_submitted_at?: string
  reviewed_by?: string
  reviewed_at?: string
  review_note?: string
  notes?: string
  bookings?: Booking[] // Related individual bookings
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CheckoutRequest {
  items: Array<{ service_id: string; quantity: number; notes?: string }>
  coupon_code?: string
  payment_method: string // 'credit_card' | 'debit_card' | 'digital_wallet' | 'bank_transfer'
}

export interface CheckoutResponse {
  bulk_order_id: string
  stripe_client_secret?: string
  checkout_url?: string
  order_number: string
  total_amount: number
  items_count: number
}

export interface PaymentMethod {
  id: string
  customer_id: string
  payment_provider: string // 'stripe', 'paypal', 'mada', etc.
  provider_id: string
  last_four?: string
  card_brand?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Refund {
  id: string
  booking_id: string
  bulk_order_id?: string
  refund_amount: number
  refund_reason: string
  refund_notes?: string
  stripe_refund_id?: string
  refund_status: 'initiated' | 'processing' | 'completed' | 'failed'
  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
}

export interface ServiceNotification {
  id: string
  organizer_id: string
  event_id: string
  booking_id?: string
  bulk_order_id?: string
  notification_type: 'booking_received' | 'payment_confirmed' | 'refund_issued' | 'payment_proof_received'
  title: string
  message: string
  is_read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}

export interface GuestAssignedService {
  id: string
  guest_id: string
  service_id: string
  event_id: string
  booking_id?: string
  quantity: number
  assigned_by_organizer: boolean
  assigned_at: string
}
