import { useCallback, useEffect, useRef } from 'react'
import type React from 'react'

type DropCallback<T> = (payload: T, clientX: number, clientY: number) => void

export default function useDraggable<T>(payload: T, options: { longPress?: number; onDrop: DropCallback<T> }) {
  const { longPress = 220, onDrop } = options
  const timerRef = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const ghostRef = useRef<HTMLElement | null>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const capturedElementRef = useRef<Element | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const pendingPosRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  const scheduleFlush = () => {
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      const p = pendingPosRef.current
      if (!p) return
      moveGhost(p.x, p.y)
      try {
        window.dispatchEvent(new CustomEvent('figdev-dragmove', { detail: { payload: payload as any, clientX: p.x, clientY: p.y } }))
      } catch (e) {}
      pendingPosRef.current = null
    }) as unknown as number
  }

  function createGhost(x: number, y: number) {
    const el = document.createElement('div')
    el.className = 'figdev__drag-ghost'
    el.style.position = 'fixed'
    el.style.left = '0'
    el.style.top = '0'
    el.style.width = '48px'
    el.style.height = '48px'
    el.style.borderRadius = '6px'
    el.style.background = 'rgba(0,0,0,0.55)'
    el.style.zIndex = '9999'
    el.style.pointerEvents = 'none'
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.color = 'white'
    el.style.fontSize = '12px'
    el.textContent = ''
    document.body.appendChild(el)
    ghostRef.current = el
    moveGhost(x, y)
    // visually hide the originating element to avoid duplicate visuals
    try {
      if (capturedElementRef.current) (capturedElementRef.current as HTMLElement).classList.add('figdev__device--dragging')
    } catch (e) {}
    // announce drag start so other UI (stage) can respond immediately
    try {
      window.dispatchEvent(new CustomEvent('figdev-dragstart', { detail: { payload: payload as any, clientX: x, clientY: y } }))
    } catch (e) {}
  }

  function moveGhost(x: number, y: number) {
    if (!ghostRef.current) return
    ghostRef.current.style.transform = `translate(${x + 12}px, ${y + 12}px)`
  }

  function cleanupPointerListeners() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  function cleanupTouchListeners() {
    window.removeEventListener('touchmove', onTouchMove as EventListener)
    window.removeEventListener('touchend', onTouchEnd as EventListener)
    window.removeEventListener('touchcancel', onTouchEnd as EventListener)
  }

  function destroyGhost() {
    if (ghostRef.current) {
      // restore originating element's visibility
      try {
        if (capturedElementRef.current) (capturedElementRef.current as HTMLElement).classList.remove('figdev__device--dragging')
      } catch (e) {}
      ghostRef.current.remove()
      ghostRef.current = null
    }
  }

  const onPointerMove = (ev: PointerEvent) => {
    if (!draggingRef.current) return
    pendingPosRef.current = { x: ev.clientX, y: ev.clientY }
    scheduleFlush()
    ev.preventDefault()
  }

  const onPointerUp = (ev: PointerEvent) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (draggingRef.current) {
      draggingRef.current = false
      destroyGhost()
      document.body.style.overflow = ''
      // release pointer capture if any
      try {
        if (capturedElementRef.current && pointerIdRef.current !== null && typeof capturedElementRef.current.releasePointerCapture === 'function') {
          capturedElementRef.current.releasePointerCapture(pointerIdRef.current)
        }
      } catch (e) {}
      capturedElementRef.current = null
      pointerIdRef.current = null
      try {
        window.dispatchEvent(new CustomEvent('figdev-dragend', { detail: { payload: payload as any, clientX: ev.clientX, clientY: ev.clientY } }))
      } catch (e) {}
      try {
        onDrop(payload, ev.clientX, ev.clientY)
      } catch (e) {
        // swallow to avoid breaking event loop
      }
    }
    // cancel any pending RAF
    if (rafRef.current !== null) {
      try { window.cancelAnimationFrame(rafRef.current) } catch (e) {}
      rafRef.current = null
    }
    pendingPosRef.current = null
    cleanupPointerListeners()
  }

  const onTouchMove = (ev: TouchEvent) => {
    if (!draggingRef.current) return
    const t = ev.touches && ev.touches[0]
    if (t) {
      pendingPosRef.current = { x: t.clientX, y: t.clientY }
      scheduleFlush()
    }
    ev.preventDefault()
  }

  const onTouchEnd = (ev: TouchEvent) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (draggingRef.current) {
      draggingRef.current = false
      destroyGhost()
      document.body.style.overflow = ''
      try {
        const t0 = ev.changedTouches && ev.changedTouches[0]
        if (t0) window.dispatchEvent(new CustomEvent('figdev-dragend', { detail: { payload: payload as any, clientX: t0.clientX, clientY: t0.clientY } }))
      } catch (e) {}
      const t = ev.changedTouches && ev.changedTouches[0]
      if (t) {
        try {
          onDrop(payload, t.clientX, t.clientY)
        } catch (e) {}
      }
    }
    try {
      if (capturedElementRef.current) (capturedElementRef.current as HTMLElement).classList.remove('figdev__device--dragging')
    } catch (e) {}
    capturedElementRef.current = null
    pointerIdRef.current = null
    // cancel any pending RAF
    if (rafRef.current !== null) {
      try { window.cancelAnimationFrame(rafRef.current) } catch (e) {}
      rafRef.current = null
    }
    pendingPosRef.current = null
    cleanupTouchListeners()
  }

  const startPointer = useCallback((ev: React.PointerEvent) => {
    try {
      // allow native mouse drags to continue
      // only engage custom drag for touch/pen
      if ((ev as any).pointerType === 'mouse') return
    } catch {}

    startXRef.current = ev.clientX
    startYRef.current = ev.clientY
    // attempt to capture the pointer on the originating element to keep events
    try {
      const el = ev.currentTarget as Element
      const pid = (ev as any).pointerId as number | undefined
      if (el && typeof el.setPointerCapture === 'function' && typeof pid === 'number') {
        try { el.setPointerCapture(pid) } catch (e) {}
        capturedElementRef.current = el
        pointerIdRef.current = pid
      }
    } catch (e) {}
    timerRef.current = window.setTimeout(() => {
      draggingRef.current = true
      createGhost(startXRef.current, startYRef.current)
      document.body.style.overflow = 'hidden'
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    }, options.longPress ?? longPress) as unknown as number
  }, [payload, onDrop, longPress, options.longPress])

  const cancelPointer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    // release pointer capture if any
    try {
      if (capturedElementRef.current && pointerIdRef.current !== null && typeof capturedElementRef.current.releasePointerCapture === 'function') {
        capturedElementRef.current.releasePointerCapture(pointerIdRef.current)
      }
    } catch (e) {}
    try {
      if (capturedElementRef.current) (capturedElementRef.current as HTMLElement).classList.remove('figdev__device--dragging')
    } catch (e) {}
    capturedElementRef.current = null
    pointerIdRef.current = null
  }, [])

  const startTouch = useCallback((ev: React.TouchEvent) => {
    const t = ev.touches && ev.touches[0]
    if (!t) return
    // remember originating element so we can hide it when the ghost appears
    try {
      capturedElementRef.current = ev.currentTarget as Element
    } catch (e) {}
    startXRef.current = t.clientX
    startYRef.current = t.clientY
    timerRef.current = window.setTimeout(() => {
      draggingRef.current = true
      createGhost(startXRef.current, startYRef.current)
      document.body.style.overflow = 'hidden'
      window.addEventListener('touchmove', onTouchMove as EventListener)
      window.addEventListener('touchend', onTouchEnd as EventListener)
      window.addEventListener('touchcancel', onTouchEnd as EventListener)
    }, options.longPress ?? longPress) as unknown as number
  }, [payload, onDrop, longPress, options.longPress])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      if (rafRef.current !== null) {
        try { window.cancelAnimationFrame(rafRef.current) } catch (e) {}
        rafRef.current = null
      }
      destroyGhost()
      cleanupPointerListeners()
      cleanupTouchListeners()
      document.body.style.overflow = ''
    }
  }, [])

  // Return handlers to spread onto interactive element
  return {
    onPointerDown: startPointer as unknown,
    onPointerUp: cancelPointer as unknown,
    onPointerCancel: cancelPointer as unknown,
    onTouchStart: startTouch as unknown,
    onTouchEnd: cancelPointer as unknown,
  } as React.DOMAttributes<any>
}
