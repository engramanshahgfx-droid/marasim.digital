'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import {
  InvitationCustomization,
  InvitationData,
  INVITATION_TEMPLATES,
  TemplateStyle,
} from '@/types/invitations'
import ElegantInvitation from './ElegantInvitation'
import MinimalInvitation from './MinimalInvitation'
import ModernInvitation from './ModernInvitation'
import PlayfulInvitation from './PlayfulInvitation'
import ProfessionalInvitation from './ProfessionalInvitation'

interface TemplateCustomizationEditorProps {
  templateId: TemplateStyle
  eventId: string
  eventData?: {
    event_name: string
    host_name: string
    date: string
    time: string
    location: string
    description?: string
    guest_count?: number
  }
  onSave?: (data: any) => void
  onCancel?: () => void
}

type ActivePanel = null | 'backdrop' | 'stickers' | 'logo' | 'header' | 'text' | 'colors' | 'font'
type CanvasItemType = 'sticker' | 'text' | 'logo'

type CanvasItem = {
  id: string
  type: CanvasItemType
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
  color?: string
  text?: string
  src?: string
  stickerGlyph?: string
  stickerImageUrl?: string
  stickerName?: string
}

const TEMPLATE_COMPONENTS: Record<TemplateStyle, React.ComponentType<any>> = {
  elegant: ElegantInvitation,
  modern: ModernInvitation,
  minimal: MinimalInvitation,
  playful: PlayfulInvitation,
  professional: ProfessionalInvitation,
}

const BACKDROP_OPTIONS = [
  { id: 1, name: 'Mist', css: '#e8ecef' },
  { id: 2, name: 'Peach', css: '#f6e3d8' },
  { id: 3, name: 'Gold', css: '#d7b47d' },
  { id: 4, name: 'Rose', css: '#d4a8a8' },
  { id: 5, name: 'Plum', css: '#b7a8be' },
  { id: 6, name: 'Cocoa', css: '#a98d7a' },
  { id: 7, name: 'Linen', css: 'linear-gradient(135deg, #f5f2e8 0%, #ddd8c4 100%)' },
  { id: 8, name: 'Sunset', css: 'linear-gradient(140deg, #f8d6b0 0%, #d49770 100%)' },
  { id: 9, name: 'Night', css: 'linear-gradient(150deg, #1f2a44 0%, #344c77 100%)' },
]

const STICKER_OPTIONS = [
  { id: 1, name: 'Golden Vine Details', imageUrl: 'https://assets.ppassets.com/p-78vZww2jq7BGx2LHkjeScW/flyer/sticker_svg/static_thumb_small' },
  { id: 2, name: 'Floral Frieze', imageUrl: 'https://assets.ppassets.com/p-43svb4tChjGpGgr73sP3bD/flyer/sticker_svg/static_thumb_small' },
  { id: 3, name: 'Soft Scroll', imageUrl: 'https://assets.ppassets.com/p-2KA335JyApnsJXVtGq3muf/flyer/sticker_svg/static_thumb_small' },
  { id: 4, name: 'Teacup', imageUrl: 'https://assets.ppassets.com/p-qtcTl6TATPvSeIBw0bRG0/flyer/sticker_svg/static_thumb_small' },
  { id: 5, name: 'Floral Cartouche', imageUrl: 'https://assets.ppassets.com/p-3lgGxrBRBPS1k6ihTXzQhm/flyer/sticker_svg/static_thumb_small' },
  { id: 6, name: 'Save the Date Angled', imageUrl: 'https://assets.ppassets.com/p-4wN8ZmvlrzcxWs8ULIvrG8/flyer/sticker_svg/static_thumb_small' },
  { id: 7, name: "Trail's End Save the Date", imageUrl: 'https://assets.ppassets.com/p-6bsX0sUSukCTBPUoTVpbPS/flyer/sticker_svg/static_thumb_small' },
  { id: 8, name: 'Passport to Romance', imageUrl: 'https://assets.ppassets.com/p-545fSVCy4v9v45xuzyLh6F/flyer/sticker_svg/static_thumb_small' },
  { id: 9, name: 'Calligraphy RSVP', imageUrl: 'https://assets.ppassets.com/p-4n6SccawagsXgn3tKHTSgL/flyer/sticker_svg/static_thumb_small' },
  { id: 10, name: 'Voice of Joy', imageUrl: 'https://assets.ppassets.com/p-22IqPrLpQPKJSj9wBNRKyP/flyer/sticker_svg/static_thumb_small' },
  { id: 11, name: 'Tompion', imageUrl: 'https://assets.ppassets.com/p-1PUpMMebZ4JGkS3vucjRae/flyer/sticker_svg/static_thumb_small' },
  { id: 12, name: 'Together', imageUrl: 'https://assets.ppassets.com/p-6crQHMNWn9Rjm0UYfOVIuL/flyer/sticker_svg/static_thumb_small' },
  { id: 13, name: 'Rubell', imageUrl: 'https://assets.ppassets.com/p-3xI3tTENF2g4gJVHz2wtV4/flyer/sticker_svg/static_thumb_small' },
  { id: 14, name: 'Save the Date Typography', imageUrl: 'https://assets.ppassets.com/p-4NvKBnQpcQWtuzkVofS1PL/flyer/sticker_svg/static_thumb_small' },
  { id: 15, name: 'Sincerely', imageUrl: 'https://assets.ppassets.com/p-ywu39LUV3fBeZulOSiolV/flyer/sticker_svg/static_thumb_small' },
  { id: 16, name: 'Save the Date Banner', imageUrl: 'https://assets.ppassets.com/p-3iCojUQggmdS9IJpQvTQDz/flyer/sticker_svg/static_thumb_small' },
  { id: 17, name: 'Invite You To Celebrate Their Marriage', imageUrl: 'https://assets.ppassets.com/p-8q6Tco9Q2pBrDXVIoTbJt/flyer/sticker_svg/static_thumb_small' },
  { id: 18, name: 'Frame Matting', imageUrl: 'https://assets.ppassets.com/p-26Yl35wFYgjLLpXbTP3a3Y/flyer/sticker_svg/static_thumb_small' },
  { id: 19, name: 'Vintage Save the Date', imageUrl: 'https://assets.ppassets.com/p-1GQatvhIZvi3mju5bGMbKt/flyer/sticker_svg/static_thumb_small' },
  { id: 20, name: 'Daguerre', imageUrl: 'https://assets.ppassets.com/p-Gy8mKq2r8uwODKHymB9Qz/flyer/sticker_svg/static_thumb_small' },
  { id: 21, name: 'Sincerely New', imageUrl: 'https://assets.ppassets.com/p-6X55ucNmQFrKXeOU81A6Tb/flyer/sticker_svg/static_thumb_small' },
  { id: 22, name: 'Brand New Day', imageUrl: 'https://assets.ppassets.com/p-1yaMoNKHRyps5tOX3cW8C0/flyer/sticker_svg/static_thumb_small' },
  { id: 23, name: 'Virtual', imageUrl: 'https://assets.ppassets.com/p-4Hyayg3X3xLAxIFMkwhprS/flyer/sticker_svg/static_thumb_small' },
  { id: 24, name: 'Walker', imageUrl: 'https://assets.ppassets.com/p-4HPaDrx8VJvsgKsVX46eWV/flyer/sticker_svg/static_thumb_small' },
  { id: 25, name: 'Welcome', imageUrl: 'https://assets.ppassets.com/p-YSHRIFGPRxueT0PnnFZTA/flyer/sticker_svg/static_thumb_small' },
  { id: 26, name: 'Bridal Shower', imageUrl: 'https://assets.ppassets.com/p-7hy6RvuRemb7SZ5SFHGYzE/flyer/sticker_svg/static_thumb_small' },
  { id: 27, name: 'Classic Wedding Cake', imageUrl: 'https://assets.ppassets.com/p-lk2DdF6QINk6fSg6DUyK3/flyer/sticker_svg/static_thumb_small' },
  { id: 28, name: 'Bride and Groom', imageUrl: 'https://assets.ppassets.com/p-1P8z5C6BtCIAObqAZz2SPJ/flyer/sticker_svg/static_thumb_small' },
  { id: 29, name: "Trail's End And", imageUrl: 'https://assets.ppassets.com/p-3DT7LXwhSDH0KK6DWvuwwI/flyer/sticker_svg/static_thumb_small' },
  { id: 30, name: 'Wedding Bands', imageUrl: 'https://assets.ppassets.com/p-6tNKMubW6lFtEV7n9hmWNM/flyer/sticker_svg/static_thumb_small' },
  { id: 31, name: 'Garland', imageUrl: 'https://assets.ppassets.com/p-21CdAg63g3ILr950d72tfu/flyer/sticker_svg/static_thumb_small' },
  { id: 32, name: 'Bride', imageUrl: 'https://assets.ppassets.com/p-4ZGFDVZep0ihMGLhDtEA5o/flyer/sticker_svg/static_thumb_small' },
  { id: 33, name: 'Deco Dancers', imageUrl: 'https://assets.ppassets.com/p-U3FjMduXUFeuZ4MLGkWc9/flyer/sticker_svg/static_thumb_small' },
  { id: 34, name: "YOU'RE INVITED", imageUrl: 'https://assets.ppassets.com/p-osQO1XQs6rA9zkTVVakis/flyer/sticker_svg/static_thumb_small' },
  { id: 35, name: 'Polka Dot Wedding Cake', imageUrl: 'https://assets.ppassets.com/p-6IXskdGutXODIRwyIz8tvk/flyer/sticker_svg/static_thumb_small' },
  { id: 36, name: 'Topiary', imageUrl: 'https://assets.ppassets.com/p-2bOsA5eWEXvunc2IzxvDXN/flyer/sticker_svg/static_thumb_small' },
  { id: 37, name: 'Chandelier', imageUrl: 'https://assets.ppassets.com/p-3ECh0eRzUObnd3eXdsws1e/flyer/sticker_svg/static_thumb_small' },
  { id: 38, name: 'Parasol', imageUrl: 'https://assets.ppassets.com/p-483AwvY3toT7ahQuqe5CVh/flyer/sticker_svg/static_thumb_small' },
  { id: 39, name: 'Thick Frame with Thin Frame', imageUrl: 'https://assets.ppassets.com/p-4xPs5dx3DT4J3SjOyHNrDT/flyer/sticker_svg/static_thumb_small' },
  { id: 40, name: 'Delicate Heart', imageUrl: 'https://assets.ppassets.com/p-1d9JBiDWJAwgSqgI4tT2YD/flyer/sticker_svg/static_thumb_small' },
  { id: 41, name: 'Itinerary', imageUrl: 'https://assets.ppassets.com/p-5Qal8rGZ9BaGHOAxM4iO5C/flyer/sticker_svg/static_thumb_small' },
  { id: 42, name: 'Party Tent', imageUrl: 'https://assets.ppassets.com/p-58HVJb31nCG4K0YnaQ4ozG/flyer/sticker_svg/static_thumb_small' },
  { id: 43, name: 'Timepiece', imageUrl: 'https://assets.ppassets.com/p-3S003yUfJBG88vkyGSMlG8/flyer/sticker_svg/static_thumb_small' },
  { id: 44, name: 'Flower Vase', imageUrl: 'https://assets.ppassets.com/p-2GVzsQ6vSg6EtEoVy7hSF8/flyer/sticker_svg/static_thumb_small' },
  { id: 45, name: 'Raw Edge And', imageUrl: 'https://assets.ppassets.com/p-4Id2AxbEClWdYDNv3KMRct/flyer/sticker_svg/static_thumb_small' },
  { id: 46, name: 'And Script', imageUrl: 'https://assets.ppassets.com/p-4rF12kP28Ne6vIMnbWcfxK/flyer/sticker_svg/static_thumb_small' },
  { id: 47, name: 'Peace on Earth', imageUrl: 'https://assets.ppassets.com/p-1GPRqZt1jWnFoexdL54dOP/flyer/sticker_svg/static_thumb_small' },
  { id: 48, name: 'Peony', imageUrl: 'https://assets.ppassets.com/p-2M7X9pNK15ZkzGY81ikyPG/flyer/sticker_svg/static_thumb_small' },
]

const FONT_OPTIONS = [
  { id: 'serif', label: 'Serif' },
  { id: 'sans-serif', label: 'Sans Serif' },
  { id: 'monospace', label: 'Monospace' },
  { id: 'cursive', label: 'Cursive' },
]

const HEADER_LOGO_OPTIONS = [
  { value: 'classic', label: 'Classic header' },
  { value: 'custom', label: 'Custom header' },
  { value: 'remove', label: 'Remove header' },
]

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
        active
          ? 'border-blue-500 bg-blue-50 text-blue-800'
          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }`}
    >
      <div className="text-lg">{icon}</div>
      <div className="mt-1 text-xs font-semibold">{label}</div>
    </button>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function createItemId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export default function TemplateCustomizationEditor({
  templateId,
  eventId,
  eventData,
  onSave,
  onCancel,
}: TemplateCustomizationEditorProps) {
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const template = INVITATION_TEMPLATES[templateId]
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId]

  const [invitationData, setInvitationData] = useState<Partial<InvitationData>>({
    template_id: templateId,
    event_id: eventId,
    event_name: eventData?.event_name || 'Your Event Title',
    host_name: eventData?.host_name || 'Your Name',
    date: eventData?.date || '',
    time: eventData?.time || '18:00',
    location: eventData?.location || 'Location Name',
    description: eventData?.description || 'invite you to celebrate',
    timezone: 'UTC',
    guest_count: eventData?.guest_count,
    custom_colors: {
      primary: template.colors.primary,
      secondary: template.colors.secondary,
      accent: template.colors.accent,
    },
  })

  const [customization, setCustomization] = useState<Partial<InvitationCustomization>>({
    template_id: templateId,
    primary_color: template.colors.primary,
    secondary_color: template.colors.secondary,
    accent_color: template.colors.accent,
    font_family: 'serif',
    style_variation: template.default_style_variation,
  })

  const [activePanel, setActivePanel] = useState<ActivePanel>('backdrop')
  const [zoom, setZoom] = useState(100)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [backdropSearch, setBackdropSearch] = useState('')
  const [stickerSearch, setStickerSearch] = useState('')
  const [selectedBackdrop, setSelectedBackdrop] = useState<number | null>(1)
  const [backgroundCss, setBackgroundCss] = useState<string>(BACKDROP_OPTIONS[0].css)
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [headerLogoMode, setHeaderLogoMode] = useState<'classic' | 'custom' | 'remove'>('classic')
  const [customHeaderLogo, setCustomHeaderLogo] = useState<string>('')

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [dragState, setDragState] = useState<{
    itemId: string
    startX: number
    startY: number
    initialX: number
    initialY: number
  } | null>(null)
  const [resizeState, setResizeState] = useState<{
    itemId: string
    centerX: number
    centerY: number
    startDistance: number
    initialScale: number
  } | null>(null)

  const selectedItem = useMemo(
    () => canvasItems.find((item) => item.id === selectedItemId) || null,
    [canvasItems, selectedItemId]
  )

  const filteredBackdrops = useMemo(() => {
    const q = backdropSearch.trim().toLowerCase()
    if (!q) return BACKDROP_OPTIONS
    return BACKDROP_OPTIONS.filter((item) => item.name.toLowerCase().includes(q))
  }, [backdropSearch])

  const filteredStickers = useMemo(() => {
    const q = stickerSearch.trim().toLowerCase()
    if (!q) return STICKER_OPTIONS
    return STICKER_OPTIONS.filter((item) => item.name.toLowerCase().includes(q))
  }, [stickerSearch])

  useEffect(() => {
    if (!dragState && !resizeState) return

    const onMouseMove = (event: MouseEvent) => {
      if (resizeState) {
        const currentDistance = Math.hypot(event.clientX - resizeState.centerX, event.clientY - resizeState.centerY)
        const ratio = currentDistance / Math.max(resizeState.startDistance, 1)
        const nextScale = clamp(resizeState.initialScale * ratio, 0.4, 4)

        setCanvasItems((prev) =>
          prev.map((item) =>
            item.id === resizeState.itemId
              ? {
                  ...item,
                  scale: nextScale,
                }
              : item
          )
        )
        return
      }

      if (!dragState) return
      const scale = zoom / 100
      const dx = (event.clientX - dragState.startX) / scale
      const dy = (event.clientY - dragState.startY) / scale

      setCanvasItems((prev) =>
        prev.map((item) =>
          item.id === dragState.itemId
            ? {
                ...item,
                x: clamp(dragState.initialX + dx, 0, 680),
                y: clamp(dragState.initialY + dy, 0, 520),
              }
            : item
        )
      )
    }

    const onMouseUp = () => {
      setDragState(null)
      setResizeState(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragState, resizeState, zoom])

  const handleTextChange = (field: keyof InvitationData, value: string) => {
    setInvitationData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleColorChange = (
    field: 'primary_color' | 'secondary_color' | 'accent_color',
    value: string
  ) => {
    setCustomization((prev) => ({
      ...prev,
      [field]: value,
    }))

    const colorFieldMap: Record<typeof field, 'primary' | 'secondary' | 'accent'> = {
      primary_color: 'primary',
      secondary_color: 'secondary',
      accent_color: 'accent',
    }

    const targetField = colorFieldMap[field]
    setInvitationData((prev) => ({
      ...prev,
      custom_colors: {
        ...prev.custom_colors,
        [targetField]: value,
      },
    }))
  }

  const addSticker = (stickerId: number, stickerName: string, imageUrl: string) => {
    const item: CanvasItem = {
      id: createItemId('sticker'),
      type: 'sticker',
      x: 320,
      y: 80,
      scale: 1.4,
      rotation: 0,
      zIndex: canvasItems.length + 10,
      color: '#222222',
      stickerImageUrl: imageUrl,
      stickerName: stickerName,
    }
    setCanvasItems((prev) => [...prev, item])
    setSelectedItemId(item.id)
  }

  const addTextBlock = () => {
    const item: CanvasItem = {
      id: createItemId('text'),
      type: 'text',
      x: 280,
      y: 430,
      scale: 1,
      rotation: 0,
      zIndex: canvasItems.length + 10,
      color: '#1f2937',
      text: isArabic ? 'أضف نصك هنا' : 'Add your text here',
    }
    setCanvasItems((prev) => [...prev, item])
    setSelectedItemId(item.id)
    setActivePanel('text')
  }

  const uploadImageItem = (file: File, type: 'logo') => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const src = String(event.target?.result || '')
      const item: CanvasItem = {
        id: createItemId(type),
        type,
        x: 300,
        y: 40,
        scale: 1,
        rotation: 0,
        zIndex: canvasItems.length + 10,
        src,
      }
      setCanvasItems((prev) => [...prev, item])
      setSelectedItemId(item.id)
      setInvitationData((prev) => ({
        ...prev,
        images: {
          ...prev.images,
          logo: src,
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  const onCanvasItemMouseDown = (event: React.MouseEvent, itemId: string) => {
    event.stopPropagation()
    const current = canvasItems.find((item) => item.id === itemId)
    if (!current) return

    setSelectedItemId(itemId)
    setDragState({
      itemId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: current.x,
      initialY: current.y,
    })
  }

  const onResizeHandleMouseDown = (event: React.MouseEvent, itemId: string) => {
    event.stopPropagation()
    event.preventDefault()

    const current = canvasItems.find((item) => item.id === itemId)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!current || !canvasRect) return

    const zoomScale = zoom / 100
    const centerX = canvasRect.left + current.x * zoomScale
    const centerY = canvasRect.top + current.y * zoomScale
    const startDistance = Math.hypot(event.clientX - centerX, event.clientY - centerY)

    setResizeState({
      itemId,
      centerX,
      centerY,
      startDistance,
      initialScale: current.scale,
    })
    setSelectedItemId(itemId)
  }

  const updateSelectedItem = (patch: Partial<CanvasItem>) => {
    if (!selectedItemId) return
    setCanvasItems((prev) =>
      prev.map((item) => (item.id === selectedItemId ? { ...item, ...patch } : item))
    )
  }

  const deleteSelectedItem = () => {
    if (!selectedItemId) return
    setCanvasItems((prev) => prev.filter((item) => item.id !== selectedItemId))
    setSelectedItemId(null)
  }

  const duplicateSelectedItem = () => {
    if (!selectedItem) return
    const duplicate: CanvasItem = {
      ...selectedItem,
      id: createItemId(selectedItem.type),
      x: clamp(selectedItem.x + 20, 0, 680),
      y: clamp(selectedItem.y + 20, 0, 520),
      zIndex: canvasItems.length + 20,
    }
    setCanvasItems((prev) => [...prev, duplicate])
    setSelectedItemId(duplicate.id)
  }

  const handleBackdropSelect = (id: number) => {
    const backdrop = BACKDROP_OPTIONS.find((entry) => entry.id === id)
    if (!backdrop) return
    setSelectedBackdrop(id)
    setBackgroundCss(backdrop.css)
  }

  const handleHeaderLogoUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      setCustomHeaderLogo(String(event.target?.result || ''))
      setHeaderLogoMode('custom')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload = {
        event_id: eventId,
        template_id: templateId,
        invitation_data: invitationData,
        customization,
        canvas_items: canvasItems,
        backdrop_id: selectedBackdrop,
        backdrop_css: backgroundCss,
        header_logo: {
          mode: headerLogoMode,
          custom_url: customHeaderLogo,
        },
      }
      await onSave?.(payload)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save invitation')
    } finally {
      setIsSaving(false)
    }
  }

  const renderItem = (item: CanvasItem) => {
    const isSelected = selectedItemId === item.id
    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      left: item.x,
      top: item.y,
      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
      transformOrigin: 'center center',
      zIndex: item.zIndex,
      cursor: dragState?.itemId === item.id ? 'grabbing' : 'grab',
      userSelect: 'none',
      border: isSelected ? '2px dashed #2563eb' : '2px solid transparent',
      padding: 4,
      borderRadius: 8,
      backgroundColor: isSelected ? 'rgba(255,255,255,0.65)' : 'transparent',
    }

    const handles = isSelected ? (
      <>
        <button
          type="button"
          onMouseDown={(e) => onResizeHandleMouseDown(e, item.id)}
          className="absolute -left-2 -top-2 h-3.5 w-3.5 rounded-full border border-blue-700 bg-white"
          style={{ cursor: 'nwse-resize' }}
        />
        <button
          type="button"
          onMouseDown={(e) => onResizeHandleMouseDown(e, item.id)}
          className="absolute -right-2 -top-2 h-3.5 w-3.5 rounded-full border border-blue-700 bg-white"
          style={{ cursor: 'nesw-resize' }}
        />
        <button
          type="button"
          onMouseDown={(e) => onResizeHandleMouseDown(e, item.id)}
          className="absolute -bottom-2 -left-2 h-3.5 w-3.5 rounded-full border border-blue-700 bg-white"
          style={{ cursor: 'nesw-resize' }}
        />
        <button
          type="button"
          onMouseDown={(e) => onResizeHandleMouseDown(e, item.id)}
          className="absolute -bottom-2 -right-2 h-3.5 w-3.5 rounded-full border border-blue-700 bg-white"
          style={{ cursor: 'nwse-resize' }}
        />
      </>
    ) : null

    if (item.type === 'sticker') {
      return (
        <div key={item.id} style={commonStyle} onMouseDown={(e) => onCanvasItemMouseDown(e, item.id)}>
          {item.stickerImageUrl ? (
            <img 
              src={item.stickerImageUrl} 
              alt={item.stickerName || 'Sticker'} 
              className="h-24 w-24 object-contain drop-shadow-sm"
            />
          ) : (
            <span style={{ color: item.color || '#111111', fontSize: 40 }}>{item.stickerGlyph || '✦'}</span>
          )}
          {handles}
        </div>
      )
    }

    if (item.type === 'text') {
      return (
        <div key={item.id} style={commonStyle} onMouseDown={(e) => onCanvasItemMouseDown(e, item.id)}>
          <span
            style={{
              color: item.color || '#111111',
              fontSize: 20,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: customization.font_family || 'serif',
            }}
          >
            {item.text || 'Text'}
          </span>
          {handles}
        </div>
      )
    }

    return (
      <div key={item.id} style={commonStyle} onMouseDown={(e) => onCanvasItemMouseDown(e, item.id)}>
        {item.src ? (
          <img src={item.src} alt="Canvas item" className="h-16 w-16 rounded object-cover shadow-md" />
        ) : (
          <div className="h-16 w-16 rounded bg-gray-300" />
        )}
        {handles}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-300 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="rounded p-1 text-gray-700 hover:bg-gray-100">
            X
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {isArabic ? 'محرر القالب التفاعلي' : 'Interactive Template Editor'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <button className="rounded px-2 py-1 text-gray-700 hover:bg-gray-100">Preview</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : isArabic ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && <div className="mx-4 mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</div>}

      <div className="flex h-[calc(100vh-62px)]">
        <div className="w-24 border-r border-gray-300 bg-white px-2 py-4">
          <div className="space-y-2">
            <ToolButton icon="B" label={isArabic ? 'خلفية' : 'Backdrop'} active={activePanel === 'backdrop'} onClick={() => setActivePanel('backdrop')} />
            <ToolButton icon="S" label={isArabic ? 'ملصقات' : 'Stickers'} active={activePanel === 'stickers'} onClick={() => setActivePanel('stickers')} />
            <ToolButton icon="L" label={isArabic ? 'شعار' : 'Add logo'} active={activePanel === 'logo'} onClick={() => setActivePanel('logo')} />
            <ToolButton icon="H" label={isArabic ? 'رأس' : 'Header'} active={activePanel === 'header'} onClick={() => setActivePanel('header')} />
            <ToolButton icon="T" label={isArabic ? 'نص' : 'Text'} active={activePanel === 'text'} onClick={() => setActivePanel('text')} />
            <ToolButton icon="C" label={isArabic ? 'ألوان' : 'Colors'} active={activePanel === 'colors'} onClick={() => setActivePanel('colors')} />
            <ToolButton icon="F" label={isArabic ? 'خط' : 'Font'} active={activePanel === 'font'} onClick={() => setActivePanel('font')} />
          </div>
        </div>

        <div className="w-[340px] border-r border-gray-300 bg-[#f9f9f9] p-4">
          {activePanel === 'backdrop' && (
            <div>
              <h3 className="mb-3 text-xl font-semibold">{isArabic ? 'الخلفية' : 'Backdrop'}</h3>
              <input
                type="text"
                value={backdropSearch}
                onChange={(e) => setBackdropSearch(e.target.value)}
                placeholder={isArabic ? 'ابحث عن خلفية' : 'Search backdrop'}
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                {filteredBackdrops.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleBackdropSelect(item.id)}
                    className={`h-16 rounded-lg border-2 ${selectedBackdrop === item.id ? 'border-blue-600' : 'border-gray-300'}`}
                    style={{ background: item.css }}
                    title={item.name}
                  />
                ))}
              </div>
            </div>
          )}

          {activePanel === 'stickers' && (
            <div>
              <h3 className="mb-3 text-xl font-semibold">{isArabic ? 'الملصقات' : 'Stickers'}</h3>
              <input
                type="text"
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                placeholder={isArabic ? 'ابحث عن ملصق' : 'Search sticker'}
                className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {filteredStickers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addSticker(item.id, item.name, item.imageUrl)}
                    className="rounded-lg border border-gray-300 bg-white p-2 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center gap-1"
                    title={item.name}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="h-12 w-12 object-contain"
                    />
                    <span className="text-xs text-gray-600 text-center line-clamp-2">{item.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">{isArabic ? 'أضف الملصق ثم اسحبه مباشرة فوق البطاقة.' : 'Add sticker then drag it directly on the card.'}</p>
            </div>
          )}

          {activePanel === 'logo' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{isArabic ? 'إضافة شعار' : 'Add Logo'}</h3>
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-blue-300 bg-white p-5 text-center hover:bg-blue-50">
                <span className="text-sm font-semibold text-blue-700">{isArabic ? 'رفع صورة الشعار' : 'Upload logo image'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadImageItem(file, 'logo')
                  }}
                />
              </label>
            </div>
          )}

          {activePanel === 'header' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{isArabic ? 'شعار الرأس' : 'Header Logo'}</h3>
              <div className="space-y-2">
                {HEADER_LOGO_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                    <input
                      type="radio"
                      checked={headerLogoMode === opt.value}
                      onChange={() => setHeaderLogoMode(opt.value as 'classic' | 'custom' | 'remove')}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {headerLogoMode === 'custom' && (
                <label className="block cursor-pointer rounded-lg border-2 border-dashed border-blue-300 bg-white p-4 text-center hover:bg-blue-50">
                  <span className="text-sm font-semibold text-blue-700">{isArabic ? 'رفع شعار الرأس' : 'Upload header logo'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleHeaderLogoUpload(file)
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {activePanel === 'text' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{isArabic ? 'النصوص' : 'Text'}</h3>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {isArabic
                  ? 'يمكنك تخصيص كل دعوة تلقائياً باستخدام المتغيرات: {{guest_name}} {{special_note}} {{event_name}} {{event_date}} {{venue}}'
                  : 'You can personalize every guest card with tokens: {{guest_name}} {{special_note}} {{event_name}} {{event_date}} {{venue}}'}
              </div>
              <input
                type="text"
                value={invitationData.event_name || ''}
                onChange={(e) => handleTextChange('event_name', e.target.value)}
                placeholder={isArabic ? 'عنوان الحدث' : 'Event title'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={invitationData.host_name || ''}
                onChange={(e) => handleTextChange('host_name', e.target.value)}
                placeholder={isArabic ? 'اسم المضيف' : 'Host name'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={invitationData.location || ''}
                onChange={(e) => handleTextChange('location', e.target.value)}
                placeholder={isArabic ? 'الموقع' : 'Location'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={invitationData.description || ''}
                onChange={(e) => handleTextChange('description', e.target.value)}
                placeholder={
                  isArabic
                    ? 'رسالة عامة للضيوف (يمكنك استخدام {{guest_name}} و {{special_note}})'
                    : 'General message (supports {{guest_name}} and {{special_note}})'
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                value={invitationData.special_instructions || ''}
                onChange={(e) => handleTextChange('special_instructions', e.target.value)}
                placeholder={
                  isArabic
                    ? 'تعليمات إضافية أو ملاحظة مخصصة'
                    : 'Extra instructions or personalized note block'
                }
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={invitationData.date || ''}
                  onChange={(e) => handleTextChange('date', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={invitationData.time || ''}
                  onChange={(e) => handleTextChange('time', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={addTextBlock}
                className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                {isArabic ? 'إضافة نص قابل للسحب' : 'Add draggable text'}
              </button>
            </div>
          )}

          {activePanel === 'colors' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">{isArabic ? 'الألوان' : 'Colors'}</h3>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Primary</label>
                <input
                  type="color"
                  value={customization.primary_color || '#000000'}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="h-12 w-full rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Secondary</label>
                <input
                  type="color"
                  value={customization.secondary_color || '#000000'}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="h-12 w-full rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Accent</label>
                <input
                  type="color"
                  value={customization.accent_color || '#000000'}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="h-12 w-full rounded-lg border border-gray-300"
                />
              </div>
            </div>
          )}

          {activePanel === 'font' && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{isArabic ? 'الخط' : 'Font'}</h3>
              <select
                value={customization.font_family || 'serif'}
                onChange={(e) => setCustomization((prev) => ({ ...prev, font_family: e.target.value as any }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedItem && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <h4 className="mb-2 text-sm font-semibold text-blue-900">{isArabic ? 'العنصر المحدد' : 'Selected item'}</h4>
              {selectedItem.type === 'text' && (
                <input
                  type="text"
                  value={selectedItem.text || ''}
                  onChange={(e) => updateSelectedItem({ text: e.target.value })}
                  className="mb-2 w-full rounded border border-blue-300 px-2 py-1 text-sm"
                />
              )}
              {(selectedItem.type === 'text' || selectedItem.type === 'sticker') && (
                <input
                  type="color"
                  value={selectedItem.color || '#111111'}
                  onChange={(e) => updateSelectedItem({ color: e.target.value })}
                  className="mb-2 h-10 w-full rounded border border-blue-300"
                />
              )}
              <div className="mb-2">
                <label className="mb-1 block text-xs text-blue-800">Scale</label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={selectedItem.scale}
                  onChange={(e) => updateSelectedItem({ scale: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs text-blue-800">Rotate</label>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selectedItem.rotation}
                  onChange={(e) => updateSelectedItem({ rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={duplicateSelectedItem} className="rounded bg-white px-2 py-1 text-xs font-semibold text-blue-900">
                  {isArabic ? 'نسخ' : 'Duplicate'}
                </button>
                <button onClick={deleteSelectedItem} className="rounded bg-white px-2 py-1 text-xs font-semibold text-red-700">
                  {isArabic ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6" style={{ background: backgroundCss }}>
          <div className="mx-auto w-fit">
            <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
              <button
                onClick={() => setZoom((z) => clamp(z - 10, 60, 170))}
                className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
              >
                -
              </button>
              <span className="w-14 text-center text-sm font-semibold">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => clamp(z + 10, 60, 170))}
                className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
              >
                +
              </button>
            </div>

            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              {headerLogoMode !== 'remove' && (
                <div className="mb-3 flex justify-center">
                  {headerLogoMode === 'custom' && customHeaderLogo ? (
                    <img src={customHeaderLogo} alt="Header logo" className="h-10 object-contain" />
                  ) : (
                    <div className="rounded border border-dashed border-gray-400 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-gray-700">
                      PAPERLESS STYLE
                    </div>
                  )}
                </div>
              )}

              <div
                ref={canvasRef}
                onMouseDown={() => setSelectedItemId(null)}
                className="relative h-[560px] w-[760px] overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl"
                style={{ fontFamily: customization.font_family || 'serif' }}
              >
                <TemplateComponent
                  data={{
                    ...invitationData,
                    template_id: templateId,
                  } as InvitationData}
                  customization={{
                    ...customization,
                    template_id: templateId,
                  } as InvitationCustomization}
                />

                <div className="pointer-events-none absolute inset-0">
                  <div className="pointer-events-auto">{canvasItems.map((item) => renderItem(item))}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
