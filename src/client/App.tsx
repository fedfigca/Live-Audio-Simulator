import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Info, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DeviceCatalog, DeviceSummary } from '../simulation/application/catalog/DeviceCatalog'

const tracks = [
  { name: 'Late Night Transit', artist: 'Signal Bloom', duration: '03:42' },
  { name: 'Glass Elevators', artist: 'Mira Vale', duration: '04:18' },
  { name: 'Soft Focus', artist: 'North Arcade', duration: '02:56' },
]

const COLOR_STORAGE_KEY = 'figdev-base-color'
const COLOR_PRESETS = [
  { name: 'Captain Bluebeard', value: '#1A2B3C' },
  { name: 'Moss Boss', value: '#232C22' },
]

type PlacedDevice = DeviceSummary & {
  instanceId: string
  x: number
  y: number
  width: number
  height: number
}

function getDefaultDeviceSize(device: DeviceSummary): { width: number; height: number } {
  if (device.name === 'Mixer') {
    return { width: 38, height: 46 }
  }

  if (device.name === 'Audio Player') {
    return { width: 34, height: 32 }
  }

  return { width: 28, height: 28 }
}

function formatPortSummary(device: DeviceSummary): string {
  return device.ports
    .map((port) => {
      const acceptedConnectors = port.acceptedConnectors?.length
        ? ` (${port.acceptedConnectors.join(' / ')})`
        : ''
      const channels = port.channels ? `${port.channels}ch` : ''
      const signal = port.signalLevel ?? ''
      const power = port.providesPhantomPower ? ' +48V' : port.requiresPhantomPower ? ' phantom' : ''

      return `${port.name}: ${port.connector}${acceptedConnectors} ${channels} ${signal}${power}`.trim()
    })
    .join(' · ')
}

function formatPortDetails(port: DeviceSummary['physicalPorts'][number]): string {
  const acceptedConnectors = port.acceptedConnectors?.length
    ? ` accepts ${port.acceptedConnectors.map((connector) => connector.toUpperCase()).join(' / ')}`
    : ''
  const signal = port.signalLevel ? `, ${port.signalLevel} level` : ''
  const impedance = port.impedance ? `, ${port.impedance} impedance` : ''
  const phantom = port.providesPhantomPower ? ', phantom capable' : port.requiresPhantomPower ? ', requires phantom' : ''

  return `${port.name}: ${port.connector.toUpperCase()}${acceptedConnectors}${signal}${impedance}${phantom}`
}

function DeviceDetailsModal({
  device,
  onClose,
}: {
  device: DeviceSummary | null
  onClose: () => void
}) {
  const modal = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!device || !modal.current) return

      gsap.fromTo(modal.current, { opacity: 0, y: 12 }, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
      })
    },
    { dependencies: [device] },
  )

  if (!device) return null

  return (
    <div className="figdev__modal-backdrop" role="presentation" onClick={onClose}>
      <section className="figdev__modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="device-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="figdev__modal-heading">
          <div>
            <p className="figdev__eyebrow">Device specification</p>
            <h2 id="device-modal-title">{device.name}</h2>
          </div>
          <button className="figdev__modal-close" type="button" onClick={onClose} aria-label="Close device details">x</button>
        </div>
        <div className="figdev__modal-ports">
          {device.ports.map((port) => (
            <div className="figdev__modal-port" key={port.name}>
              <strong>{port.name}</strong>
              <small>{formatPortSummary({ ...device, ports: [port] })}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SessionModal({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const modal = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!modal.current) return

    gsap.fromTo(modal.current, { opacity: 0, y: 12 }, {
      opacity: 1,
      y: 0,
      duration: 0.25,
      ease: 'power2.out',
    })
  }, [])

  return (
    <div className="figdev__modal-backdrop" role="presentation" onClick={onClose}>
      <section className="figdev__modal figdev__session-modal" ref={modal} role="dialog" aria-modal="true" aria-labelledby="session-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="figdev__modal-heading">
          <div>
            <p className="figdev__eyebrow">Current elements</p>
            <h2 id="session-modal-title">Audio Player session</h2>
          </div>
          <button className="figdev__modal-close" type="button" onClick={onClose} aria-label="Close session details">x</button>
        </div>
        <div className="figdev__session-visualizer">
          {Array.from({ length: 48 }, (_, index) => (
            <span key={index} style={{ '--bar-height': `${24 + ((index * 17) % 66)}%` } as React.CSSProperties} />
          ))}
        </div>
        <div className="figdev__transport">
          <button className="figdev__transport-button" type="button" aria-label="Previous track">|&lt;</button>
          <button className="figdev__transport-button figdev__transport-button--primary" type="button" onClick={() => setIsPlaying((playing) => !playing)} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '||' : '>'}
          </button>
          <button className="figdev__transport-button" type="button" aria-label="Next track">&gt;|</button>
          <div className="figdev__transport-progress"><span /></div>
          <span className="figdev__transport-volume">VOL 72%</span>
        </div>
        <div className="figdev__modal-library">
          <p className="figdev__eyebrow">Source material</p>
          {tracks.map((track, index) => (
            <div className={`figdev__modal-track ${index === 0 ? 'figdev__modal-track--active' : ''}`} key={track.name}>
              <span>0{index + 1}</span>
              <strong>{track.name}<small>{track.artist}</small></strong>
              <span>{track.duration}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Boombox() {
  const boombox = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!boombox.current) return

    gsap.fromTo(boombox.current, { opacity: 0, scale: 0.94, y: 10 }, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.45,
      ease: 'back.out(1.4)',
    })
  }, [])

  return (
    <div className="figdev__boombox" ref={boombox}>
      <span className="figdev__boombox-handle" />
      <span className="figdev__boombox-display">STEREO / FM</span>
      <span className="figdev__boombox-speaker figdev__boombox-speaker--left"><i /></span>
      <span className="figdev__boombox-speaker figdev__boombox-speaker--right"><i /></span>
      <span className="figdev__boombox-deck"><i /><i /><i /></span>
    </div>
  )
}

function GenericDeviceGraphic({
  device,
}: {
  device: DeviceSummary
}) {
  const physicalPorts = device.physicalPorts ?? device.ports
  const inputs = physicalPorts.filter((port) => port.direction === 'input')
  const outputs = physicalPorts.filter((port) => port.direction === 'output')
  const bidirectional = physicalPorts.filter((port) => port.direction === 'bidirectional')

  const renderPort = (port: typeof physicalPorts[number], type: 'input' | 'output' | 'bidirectional') => (
    <span className={`figdev__port-wrap figdev__port-wrap--${type}`} key={`${type}-${port.name}`}>
      <i className={`figdev__port figdev__port--${type}`} aria-label={formatPortDetails(port)} />
      <span className="figdev__port-label">{port.name.replace(/^(Input|Output|Aux) /, '')}</span>
      <span className="figdev__port-tooltip" role="tooltip">{formatPortDetails(port)}</span>
    </span>
  )

  return (
    <div className="figdev__generic-device">
      <span className="figdev__generic-device-category">{device.category}</span>
      <strong>{device.name}</strong>
      <span className="figdev__generic-device-body">
        {inputs.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--inputs">
          {inputs.map((port) => renderPort(port, 'input'))}
        </span>}
        <span className="figdev__generic-device-mark">FIGDEV</span>
        {bidirectional.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--bidirectional">
          {bidirectional.map((port) => renderPort(port, 'bidirectional'))}
        </span>}
        {outputs.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--outputs">
          {outputs.map((port) => renderPort(port, 'output'))}
        </span>}
      </span>
      <small>{device.ports.length} physical port{device.ports.length === 1 ? '' : 's'}</small>
    </div>
  )
}

function PlacedDeviceGraphic({
  placedDevice,
  onMove,
  onResize,
  onDelete,
  onDetails,
}: {
  placedDevice: PlacedDevice
  onMove: (instanceId: string, x: number, y: number) => void
  onResize: (instanceId: string, width: number, height: number) => void
  onDelete: (instanceId: string) => void
  onDetails: (device: DeviceSummary) => void
}) {
  const item = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)
  const resizeOrigin = useRef<{ pointerX: number; pointerY: number; width: number; height: number } | null>(null)

  const beginMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.figdev__placed-device-info, .figdev__placed-device-delete, .figdev__placed-device-resize')) return
    dragOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, x: placedDevice.x, y: placedDevice.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!item.current || !dragOrigin.current) return
    const bounds = item.current.parentElement?.getBoundingClientRect()
    if (!bounds) return
    onMove(
      placedDevice.instanceId,
      Math.max(1, Math.min(82, dragOrigin.current.x + ((event.clientX - dragOrigin.current.pointerX) / bounds.width) * 100)),
      Math.max(8, Math.min(82, dragOrigin.current.y + ((event.clientY - dragOrigin.current.pointerY) / bounds.height) * 100)),
    )
  }

  const endMove = () => {
    dragOrigin.current = null
  }

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    resizeOrigin.current = { pointerX: event.clientX, pointerY: event.clientY, width: placedDevice.width, height: placedDevice.height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const resize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!item.current || !resizeOrigin.current) return
    const bounds = item.current.parentElement?.getBoundingClientRect()
    if (!bounds) return
    onResize(
      placedDevice.instanceId,
      Math.max(12, Math.min(48, resizeOrigin.current.width + ((event.clientX - resizeOrigin.current.pointerX) / bounds.width) * 100)),
      Math.max(10, Math.min(42, resizeOrigin.current.height + ((event.clientY - resizeOrigin.current.pointerY) / bounds.height) * 100)),
    )
  }

  return (
    <div
      className="figdev__placed-device"
      ref={item}
      style={{ left: `${placedDevice.x}%`, top: `${placedDevice.y}%`, width: `${placedDevice.width}%`, height: `${placedDevice.height}%` }}
      onPointerDown={beginMove}
      onPointerMove={move}
      onPointerUp={endMove}
      onPointerCancel={endMove}
    >
      {placedDevice.name === 'Audio Player' ? <Boombox /> : <GenericDeviceGraphic device={placedDevice} />}
      <button className="figdev__placed-device-info" type="button" onClick={() => onDetails(placedDevice)} aria-label={`Open ${placedDevice.name} details`} title="Device info">
        <Info size={14} strokeWidth={2.25} />
      </button>
      <button className="figdev__placed-device-delete" type="button" onClick={() => onDelete(placedDevice.instanceId)} aria-label={`Remove ${placedDevice.name}`} title="Remove device">
        <Trash2 size={13} strokeWidth={2.25} />
      </button>
      <button className="figdev__placed-device-resize" type="button" onPointerDown={beginResize} onPointerMove={resize} onPointerUp={() => { resizeOrigin.current = null }} aria-label={`Resize ${placedDevice.name}`} />
    </div>
  )
}

function DeviceAccordion({
  title,
  devices,
  onDeviceClick,
  onDeviceDragStart,
}: {
  title: string
  devices: DeviceSummary[]
  onDeviceClick: (device: DeviceSummary) => void
  onDeviceDragStart: (device: DeviceSummary, event: React.DragEvent<HTMLButtonElement>) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const content = useRef<HTMLDivElement>(null)
  const chevron = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (!content.current || !chevron.current) return

      gsap.to(content.current, {
        height: isOpen ? 'auto' : 0,
        duration: 0.24,
        ease: 'power2.out',
      })
      gsap.to(chevron.current, {
        rotate: isOpen ? 90 : 0,
        duration: 0.24,
        ease: 'power2.out',
      })
    },
    { dependencies: [isOpen] },
  )

  return (
    <section className="figdev__device-group">
      <button
        className="figdev__device-group-toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{title}</span>
        <span className="figdev__device-group-chevron" ref={chevron}>-&gt;</span>
      </button>
      <div className="figdev__device-group-content" ref={content}>
        <div className="figdev__device-list">
          {devices.map((device) => (
            <button
              className="figdev__device"
              key={device.id}
              type="button"
              draggable
              onClick={() => onDeviceClick(device)}
              onDragStart={(event) => onDeviceDragStart(device, event)}
            >
              <strong>{device.name}</strong>
              <small>{formatPortSummary(device)}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function SettingsPanel({
  baseColor,
  onColorChange,
}: {
  baseColor: string
  onColorChange: (color: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const content = useRef<HTMLDivElement>(null)
  const chevron = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (!content.current || !chevron.current) return

      gsap.to(content.current, {
        height: isOpen ? 'auto' : 0,
        duration: 0.24,
        ease: 'power2.out',
      })
      gsap.to(chevron.current, {
        rotate: isOpen ? 90 : 0,
        duration: 0.24,
        ease: 'power2.out',
      })
    },
    { dependencies: [isOpen] },
  )

  return (
    <section className="figdev__settings">
      <button
        className="figdev__settings-toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>Settings</span>
        <span className="figdev__settings-chevron" ref={chevron}>-&gt;</span>
      </button>
      <div className="figdev__settings-content" ref={content}>
        <div className="figdev__settings-options">
          {COLOR_PRESETS.map((preset) => (
            <button
              className={`figdev__color-preset ${baseColor.toUpperCase() === preset.value ? 'figdev__color-preset--active' : ''}`}
              key={preset.value}
              type="button"
              onClick={() => onColorChange(preset.value)}
            >
              <span className="figdev__color-swatch" style={{ backgroundColor: preset.value }} />
              <span>{preset.name}</span>
            </button>
          ))}
          <label className="figdev__color-picker">
            <span className="figdev__color-swatch" style={{ backgroundColor: baseColor }} />
            <span>Make it weird</span>
            <input
              type="color"
              value={baseColor}
              onChange={(event) => onColorChange(event.target.value)}
              aria-label="Choose a custom base color"
            />
          </label>
        </div>
      </div>
    </section>
  )
}

function App() {
  const container = useRef<HTMLDivElement>(null)
  const [catalog, setCatalog] = useState<DeviceCatalog | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceSummary | null>(null)
  const [isSessionOpen, setIsSessionOpen] = useState(false)
  const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>([])
  const [isStageDragOver, setIsStageDragOver] = useState(false)
  const [baseColor, setBaseColor] = useState(() => (
    localStorage.getItem(COLOR_STORAGE_KEY) ?? COLOR_PRESETS[0].value
  ))

  useEffect(() => {
    document.documentElement.style.setProperty('--figdev-base-color', baseColor)
    localStorage.setItem(COLOR_STORAGE_KEY, baseColor)
  }, [baseColor])

  useEffect(() => {
    fetch('/api/devices')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load device catalog')
        return response.json() as Promise<DeviceCatalog>
      })
      .then(setCatalog)
      .catch(() => setCatalogError(true))
  }, [])

  useGSAP(
    () => {
      gsap.from('.figdev__reveal', {
        duration: 0.8,
        y: 18,
        opacity: 0,
        stagger: 0.08,
        ease: 'power3.out',
      })
    },
    { scope: container },
  )

  const handleDeviceDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsStageDragOver(false)

    const deviceId = event.dataTransfer.getData('application/x-figdev-device')
    const device = [...(catalog?.sources ?? []), ...(catalog?.outputs ?? []), ...(catalog?.processors ?? [])]
      .find((candidate) => candidate.id === deviceId)

    if (!device) return

    const defaultSize = getDefaultDeviceSize(device)

    setPlacedDevices((current) => [
      ...current,
      {
        ...device,
        instanceId: `${device.id}-${Date.now()}`,
        x: 8 + ((current.length * 9) % Math.max(18, 84 - defaultSize.width)),
        y: 12 + ((current.length * 7) % Math.max(18, 76 - defaultSize.height)),
        width: defaultSize.width,
        height: defaultSize.height,
      },
    ])
  }

  const updatePlacedDevice = (instanceId: string, updates: Partial<PlacedDevice>) => {
    setPlacedDevices((current) => current.map((device) => (
      device.instanceId === instanceId ? { ...device, ...updates } : device
    )))
  }

  return (
    <div className="figdev__app" ref={container}>
      <aside className="figdev__sidebar figdev__reveal">
        <div className="figdev__brand" aria-label="Live Audio Simulator">
          <span className="figdev__brand-pulse" />
          <span>LAS</span>
        </div>
        <nav aria-label="Primary navigation">
          <a className="figdev__nav-link figdev__nav-link--active" href="#studio">
            <span className="figdev__nav-link-index">01</span>
            Studio
          </a>
        </nav>
        <div className="figdev__device-browser" aria-label="Available stage devices">
          <p className="figdev__sidebar-label">Stage devices</p>
          {catalog ? (
            <>
              <DeviceAccordion title="Sources" devices={catalog.sources} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} />
              <DeviceAccordion title="Outputs" devices={catalog.outputs} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} />
              <DeviceAccordion title="Process devices" devices={catalog.processors} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} />
            </>
          ) : (
            <p className="figdev__device-browser-status">
              {catalogError ? 'Catalog unavailable' : 'Loading catalog...'}
            </p>
          )}
        </div>
        <SettingsPanel baseColor={baseColor} onColorChange={setBaseColor} />
        <p className="figdev__sidebar-footer">Build 0.1 / browser audio lab</p>
      </aside>

      <main className="figdev__main" id="studio">
        <header className="figdev__topbar figdev__reveal">
          <div>
            <p className="figdev__eyebrow">Stage layout / 01</p>
            <h1>Build the stage.</h1>
          </div>
        </header>

        <section
          className={`figdev__stage figdev__reveal ${isStageDragOver ? 'figdev__stage--drag-over' : ''}`}
          aria-label="Stage layout drop zone"
          onDragOver={(event) => {
            event.preventDefault()
            setIsStageDragOver(true)
          }}
          onDragLeave={() => setIsStageDragOver(false)}
          onDrop={handleDeviceDrop}
        >
          <div className="figdev__stage-audience">AUDIENCE / PUBLIC SIDE</div>
          <div className="figdev__stage-surface">
            <span className="figdev__stage-label">STAGE / DRAG DEVICES HERE</span>
            {placedDevices.length > 0 ? placedDevices.map((device) => (
              <PlacedDeviceGraphic
                key={device.instanceId}
                placedDevice={device}
                onMove={(instanceId, x, y) => updatePlacedDevice(instanceId, { x, y })}
                onResize={(instanceId, width, height) => updatePlacedDevice(instanceId, { width, height })}
                onDelete={(instanceId) => setPlacedDevices((current) => current.filter((item) => item.instanceId !== instanceId))}
                onDetails={(deviceDetails) => deviceDetails.name === 'Audio Player' ? setIsSessionOpen(true) : setSelectedDevice(deviceDetails)}
              />
            )) : (
              <div className="figdev__stage-empty">
                <span>+</span>
                <strong>Place a device</strong>
                <small>Drag any device from the list</small>
              </div>
            )}
          </div>
          <div className="figdev__stage-legend" aria-label="Stage port legend">
            <span><i className="figdev__legend-swatch figdev__legend-swatch--input" /> INPUT</span>
            <span><i className="figdev__legend-swatch figdev__legend-swatch--output" /> OUTPUT</span>
            <span><i className="figdev__legend-swatch figdev__legend-swatch--bidirectional" /> BIDIRECTIONAL</span>
          </div>
        </section>
      </main>
      <DeviceDetailsModal device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      {isSessionOpen && <SessionModal onClose={() => setIsSessionOpen(false)} />}
    </div>
  )
}

export default App
