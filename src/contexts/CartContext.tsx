'use client'

import { AddToCartRequest, Cart, UpdateCartItemRequest } from '@/types/marketplace'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

interface CartContextType {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  addItem: (request: AddToCartRequest) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  updateItem: (cartItemId: string, request: UpdateCartItemRequest) => Promise<void>
  clearCart: () => Promise<void>
  getCart: () => Promise<void>
  itemCount: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({
  children,
  eventId,
  guestId,
}: {
  children: React.ReactNode
  eventId: string
  guestId?: string
}) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCart = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({ eventId })
      if (guestId) query.set('guestId', guestId)
      const response = await fetch(`/api/cart?${query.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch cart')
      const data = await response.json()
      setCart(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setCart(null)
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  const addItem = useCallback(
    async (request: AddToCartRequest) => {
      setError(null)
      try {
        const query = new URLSearchParams({ eventId })
        if (guestId) query.set('guestId', guestId)
        const response = await fetch(`/api/cart/items?${query.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
        if (!response.ok) throw new Error('Failed to add item to cart')
        await getCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    },
    [eventId, getCart]
  )

  const removeItem = useCallback(
    async (cartItemId: string) => {
      setError(null)
      try {
        const query = new URLSearchParams()
        if (guestId) query.set('guestId', guestId)
        const response = await fetch(`/api/cart/items/${cartItemId}?${query.toString()}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove item from cart')
        await getCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    },
    [getCart]
  )

  const updateItem = useCallback(
    async (cartItemId: string, request: UpdateCartItemRequest) => {
      setError(null)
      try {
        const query = new URLSearchParams()
        if (guestId) query.set('guestId', guestId)
        const response = await fetch(`/api/cart/items/${cartItemId}?${query.toString()}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
        if (!response.ok) throw new Error('Failed to update cart item')
        await getCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    },
    [getCart]
  )

  const clearCart = useCallback(async () => {
    setError(null)
    try {
      const query = new URLSearchParams({ eventId })
      if (guestId) query.set('guestId', guestId)
      const response = await fetch(`/api/cart?${query.toString()}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to clear cart')
      setCart(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [eventId])

  // Load cart on mount
  useEffect(() => {
    getCart()
  }, [getCart])

  const itemCount = cart?.item_count || 0
  const totalPrice = cart?.total || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        addItem,
        removeItem,
        updateItem,
        clearCart,
        getCart,
        itemCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
