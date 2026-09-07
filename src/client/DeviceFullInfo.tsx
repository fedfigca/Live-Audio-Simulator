import React, { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { X } from 'lucide-react'
import type { DeviceSummary } from '../simulation/application/catalog/DeviceCatalog'
import { formatPortSummary } from './App'

export default function DeviceFullInfo({ device, onClose }: { device: DeviceSummary | null; onClose: () => void }) {
  const panel = useRef<HTMLElement | null>(null)
  const closeBtn = useRef<HTMLButtonElement | null>(null)

  useGSAP(() => {
    if (!panel.current) return
    gsap.fromTo(panel.current, { opacity: 0, y: 12, scale: 0.995 }, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: 'power2.out' })
  }, { dependencies: [device] })

  useEffect(() => {
    if (!device) return
    // focus the close button for accessibility
    closeBtn.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [device])

  if (!device) return null

  const handleClose = () => {
    if (panel.current) {
      gsap.to(panel.current, { opacity: 0, y: 10, duration: 0.18, ease: 'power2.in', onComplete: onClose })
      return
    }
    onClose()
  }

  return (
    <div className="figdev__device-overlay" role="dialog" aria-modal="true" aria-labelledby="device-fullinfo-title" onClick={handleClose}>
      <section className="figdev__device-overlay-panel" ref={panel} onClick={(e) => e.stopPropagation()}>
        <div className="figdev__device-overlay-heading">
          <h2 id="device-fullinfo-title">{device.name}</h2>
          <button ref={closeBtn} className="figdev__device-overlay-close" type="button" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="figdev__device-overlay-body">
          <p className="figdev__eyebrow">{device.category}</p>
          <p>{device.description ?? 'No description available.'}</p>

          <div className="figdev__device-overlay-ports">
            <h3>Ports</h3>
            {device.ports.map((port) => (
              <div key={port.name} className="figdev__device-overlay-port">
                <strong>{port.name}</strong>
                <small>{formatPortSummary({ ...device, ports: [port] })}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
