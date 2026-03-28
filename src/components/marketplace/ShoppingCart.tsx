'use client'

import { useCart } from '@/contexts/CartContext'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { AiOutlineClose, AiOutlineDelete, AiOutlineShoppingCart } from 'react-icons/ai'

interface ShoppingCartProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
}

export default function ShoppingCart({ isOpen, onClose, eventId }: ShoppingCartProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const { cart, removeItem, updateItem, isLoading } = useCart()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdatingId(cartItemId)
    try {
      await updateItem(cartItemId, { quantity: newQuantity })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (cartItemId: string) => {
    await removeItem(cartItemId)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={onClose} />

      {/* Sidebar Cart */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform overflow-y-auto bg-white shadow-lg transition-transform duration-300 ${
          isArabic ? 'translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <AiOutlineShoppingCart className="h-6 w-6" />
            <h2 className="text-xl font-bold text-gray-900">{isArabic ? 'سلة التسوق' : 'Shopping Cart'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <AiOutlineClose className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <AiOutlineShoppingCart className="h-12 w-12 text-gray-300" />
              <p className="text-center text-gray-500">{isArabic ? 'سلتك فارغة' : 'Your cart is empty'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-4">
                  {/* Service Image */}
                  {item.service?.images?.[0]?.url && (
                    <img
                      src={item.service.images[0].url}
                      alt={item.service?.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}

                  {/* Service Details */}
                  <div className="flex-1">
                    <h3 className="line-clamp-2 font-semibold text-gray-900">
                      {isArabic && item.service?.name_ar ? item.service.name_ar : item.service?.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">SAR {item.unit_price.toFixed(2)}</p>

                    {/* Quantity Control */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity <= 1}
                        className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 disabled:opacity-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id}
                        className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      SAR {(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 transition-colors hover:text-red-700"
                  >
                    <AiOutlineDelete className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Checkout */}
        {cart && cart.items.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 bg-gray-50 px-4 py-6 sm:px-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-semibold">SAR {cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{isArabic ? 'رسم المنصة (5%)' : 'Platform Fee (5%)'}</span>
                <span className="font-semibold">SAR {cart.platform_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{isArabic ? 'الضريبة (15%)' : 'Tax (15%)'}</span>
                <span className="font-semibold">SAR {cart.tax_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-4 text-lg font-bold text-gray-900">
              <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
              <span>SAR {cart.total.toFixed(2)}</span>
            </div>

            <Link
              href={`/${locale}/checkout/bank-transfer?eventId=${eventId}`}
              className="block w-full rounded-lg bg-purple-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-purple-700"
            >
              {isArabic ? 'الذهاب للدفع' : 'Proceed to Checkout'}
            </Link>

            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-gray-100"
            >
              {isArabic ? 'متابعة التسوق' : 'Continue Shopping'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
