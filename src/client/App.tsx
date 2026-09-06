import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  AudioWaveform,
  BoomBox,
  Guitar,
  Info,
  KeyboardMusic,
  Maximize2,
  MicVocal,
  SlidersHorizontal,
  Pin,
  Speaker,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { DeviceCatalog, DeviceSummary } from '../simulation/application/catalog/DeviceCatalog'
import { canConnectAudioPorts } from '../simulation/domain/stage/entities/cables/ConnectionService'

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

type CableEndpoint = {
  deviceInstanceId: string
  portId: string
}

type PlacedCable = {
  id: string
  from: CableEndpoint
  to: CableEndpoint
}

type CableDraft = {
  from: CableEndpoint
  sourcePort: DeviceSummary['physicalPorts'][number]
  pointer: { x: number; y: number }
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
          <button className="figdev__modal-close" type="button" onClick={onClose} aria-label="Close device details" title="Close">
            <X size={16} strokeWidth={2} />
          </button>
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
          <button className="figdev__modal-close" type="button" onClick={onClose} aria-label="Close session details" title="Close">
            <X size={16} strokeWidth={2} />
          </button>
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

function getDeviceIcon(device: DeviceSummary): LucideIcon {
  if (device.name === 'Audio Player') return BoomBox
  if (device.name === 'Guitar') return Guitar
  if (device.name === 'Keyboard') return KeyboardMusic
  if (device.name.includes('Microphone')) return MicVocal
  if (device.name.includes('Speaker') || device.name.includes('Subwoofer')) return Speaker
  if (device.name === 'Mixer') return SlidersHorizontal
  return AudioWaveform
}

function DeviceIconCard({ device }: { device: DeviceSummary }) {
  const Icon = getDeviceIcon(device)

  return <Icon className="figdev__device-icon" aria-hidden="true" strokeWidth={1.5} />
}

type Point = { x: number; y: number }
type Rect = { left: number; top: number; right: number; bottom: number; deviceInstanceId: string }
type CablePath = { id: string; path: string; anchor: Point; color?: string }

function segmentsHitRect(points: Point[], rect: Rect, padding = 12): boolean {
  const expanded = {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  }

  return points.slice(1).some((point, index) => {
    const previous = points[index]
    const horizontal = previous.y === point.y
    const vertical = previous.x === point.x

    if (horizontal) {
      const left = Math.min(previous.x, point.x)
      const right = Math.max(previous.x, point.x)
      return point.y >= expanded.top && point.y <= expanded.bottom && right >= expanded.left && left <= expanded.right
    }

    if (vertical) {
      const top = Math.min(previous.y, point.y)
      const bottom = Math.max(previous.y, point.y)
      return point.x >= expanded.left && point.x <= expanded.right && bottom >= expanded.top && top <= expanded.bottom
    }

    return false
  })
}

function createOrthogonalPath(start: Point, end: Point, obstacles: Rect[], width: number, height: number): string {
  const middleX = (start.x + end.x) / 2
  const middleY = (start.y + end.y) / 2
  const candidates = [
    [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end],
    [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end],
    [start, { x: start.x, y: 24 }, { x: end.x, y: 24 }, end],
    [start, { x: start.x, y: height - 24 }, { x: end.x, y: height - 24 }, end],
    [start, { x: 24, y: start.y }, { x: 24, y: end.y }, end],
    [start, { x: width - 24, y: start.y }, { x: width - 24, y: end.y }, end],
  ]
  const route = candidates.find((candidate) => !obstacles.some((obstacle) => segmentsHitRect(candidate, obstacle))) ?? candidates[0]

  return route.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function cableColor(endpoint: CableEndpoint): string {
  const value = `${endpoint.deviceInstanceId}:${endpoint.portId}`.split('').reduce(
    (hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0,
    0,
  )
  return `hsl(${Math.abs(value) % 360} 78% 62%)`
}

function CableLayer({
  cables,
  draft,
  placedDevices,
  stageRef,
  onDeleteCable,
}: {
  cables: PlacedCable[]
  draft: CableDraft | null
  placedDevices: PlacedDevice[]
  stageRef: React.RefObject<HTMLDivElement | null>
  onDeleteCable: (cableId: string) => void
}) {
  const [paths, setPaths] = useState<CablePath[]>([])
  const [size, setSize] = useState({ width: 1, height: 1 })

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const stageBounds = stage.getBoundingClientRect()
    setSize({ width: stageBounds.width, height: stageBounds.height })
    const getPoint = (endpoint: CableEndpoint): Point | null => {
      const element = stage.querySelector<HTMLElement>(`[data-device-instance="${endpoint.deviceInstanceId}"][data-port-id="${endpoint.portId}"]`)
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return {
        x: bounds.left + bounds.width / 2 - stageBounds.left,
        y: bounds.top + bounds.height / 2 - stageBounds.top,
      }
    }
    const obstacles = placedDevices.map((device) => {
      const element = stage.querySelector<HTMLElement>(`[data-device-instance="${device.instanceId}"]`)
      if (!element) return null
      const bounds = element.getBoundingClientRect()
      return {
        left: bounds.left - stageBounds.left,
        top: bounds.top - stageBounds.top,
        right: bounds.right - stageBounds.left,
        bottom: bounds.bottom - stageBounds.top,
        deviceInstanceId: device.instanceId,
      }
    }).filter((obstacle): obstacle is Rect => obstacle !== null)

    const nextPaths: CablePath[] = cables.flatMap((cable) => {
      const start = getPoint(cable.from)
      const end = getPoint(cable.to)
      if (!start || !end) return []
      const cableObstacles = obstacles.filter((obstacle) => ![cable.from.deviceInstanceId, cable.to.deviceInstanceId].includes(obstacle.deviceInstanceId))
      return [{
        id: cable.id,
        path: createOrthogonalPath(start, end, cableObstacles, stageBounds.width, stageBounds.height),
        anchor: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        color: cableColor(cable.from),
      }]
    })

    if (draft) {
      const start = getPoint(draft.from)
      if (start) {
        nextPaths.push({
          id: 'draft',
          path: createOrthogonalPath(start, draft.pointer, obstacles.filter((obstacle) => obstacle.deviceInstanceId !== draft.from.deviceInstanceId), stageBounds.width, stageBounds.height),
          anchor: draft.pointer,
          color: undefined,
        })
      }
    }

    setPaths(nextPaths)
  }, [cables, placedDevices, draft, stageRef])

  return (
    <svg className="figdev__cable-layer" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
      {paths.map((item) => item.id === 'draft' ? (
        <path className="figdev__cable figdev__cable--draft" d={item.path} key={item.id} />
      ) : (
        <g className="figdev__cable-group" key={item.id} style={{ '--cable-color': item.color } as React.CSSProperties}>
          <path className="figdev__cable" d={item.path} />
          <path className="figdev__cable-hit" d={item.path} />
          <foreignObject className="figdev__cable-control" x={item.anchor.x - 12} y={item.anchor.y - 12} width="24" height="24">
            <button type="button" onClick={() => onDeleteCable(item.id)} aria-label="Delete cable" title="Delete cable">
              <X size={12} strokeWidth={2.5} />
            </button>
          </foreignObject>
        </g>
      ))}
    </svg>
  )
}

function GenericDeviceGraphic({
  device,
  deviceInstanceId = device.id,
  cableDraft,
  onPortPointerDown,
  onPortPointerUp,
}: {
  device: DeviceSummary
  deviceInstanceId?: string
  cableDraft: CableDraft | null
  onPortPointerDown: (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => void
  onPortPointerUp: (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => void
}) {
  const physicalPorts = device.physicalPorts ?? device.ports
  const inputs = physicalPorts.filter((port) => port.direction === 'input')
  const outputs = physicalPorts.filter((port) => port.direction === 'output')
  const bidirectional = physicalPorts.filter((port) => port.direction === 'bidirectional')

  const renderPort = (port: typeof physicalPorts[number], type: 'input' | 'output' | 'bidirectional') => {
    const isSource = cableDraft?.from.deviceInstanceId === deviceInstanceId && cableDraft.from.portId === port.id
    const isTarget = Boolean(cableDraft && !isSource && canConnectAudioPorts(
      { ...cableDraft.sourcePort, deviceId: cableDraft.from.deviceInstanceId },
      { ...port, deviceId: deviceInstanceId },
    ))

    return (
    <button
      className={`figdev__port-wrap figdev__port-wrap--${type} ${isSource ? 'figdev__port-wrap--active' : ''} ${isTarget ? 'figdev__port-wrap--target' : ''}`}
      data-port-id={port.id}
      data-device-instance={deviceInstanceId}
      key={`${type}-${port.name}`}
      type="button"
      onPointerDown={(event) => onPortPointerDown({ ...device, id: deviceInstanceId }, port, event)}
      onPointerUp={(event) => onPortPointerUp({ ...device, id: deviceInstanceId }, port, event)}
      title={formatPortDetails(port)}
    >
      <i className={`figdev__port figdev__port--${type}`} aria-label={formatPortDetails(port)} />
      <span className="figdev__port-label">{port.name.replace(/^(Input|Output|Aux) /, '')}</span>
      <span className="figdev__port-tooltip" role="tooltip">{formatPortDetails(port)}</span>
    </button>
    )
  }

  return (
    <div className="figdev__generic-device">
      <span className="figdev__generic-device-category">{device.category}</span>
      <DeviceIconCard device={device} />
      <strong className="figdev__generic-device-name">{device.name}</strong>
      <span className="figdev__generic-device-body">
        {inputs.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--inputs">
          {inputs.map((port) => renderPort(port, 'input'))}
        </span>}
        {bidirectional.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--bidirectional">
          {bidirectional.map((port) => renderPort(port, 'bidirectional'))}
        </span>}
        {outputs.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--outputs">
          {outputs.map((port) => renderPort(port, 'output'))}
        </span>}
      </span>
      <small>{physicalPorts.length} physical port{physicalPorts.length === 1 ? '' : 's'}</small>
    </div>
  )
}

function PlacedDeviceGraphic({
  placedDevice,
  onMove,
  onResize,
  onDelete,
  onDetails,
  cableDraft,
  onPortPointerDown,
  onPortPointerUp,
}: {
  placedDevice: PlacedDevice
  onMove: (instanceId: string, x: number, y: number) => void
  onResize: (instanceId: string, width: number, height: number) => void
  onDelete: (instanceId: string) => void
  onDetails: (device: DeviceSummary) => void
  cableDraft: CableDraft | null
  onPortPointerDown: (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => void
  onPortPointerUp: (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => void
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
      data-device-instance={placedDevice.instanceId}
      style={{ left: `${placedDevice.x}%`, top: `${placedDevice.y}%`, width: `${placedDevice.width}%`, height: `${placedDevice.height}%` }}
      onPointerDown={beginMove}
      onPointerMove={move}
      onPointerUp={endMove}
      onPointerCancel={endMove}
    >
      <GenericDeviceGraphic device={placedDevice} deviceInstanceId={placedDevice.instanceId} cableDraft={cableDraft} onPortPointerDown={onPortPointerDown} onPortPointerUp={onPortPointerUp} />
      <button className="figdev__placed-device-info" type="button" onClick={() => onDetails(placedDevice)} aria-label={`Open ${placedDevice.name} details`} title="Device info">
        <Info size={14} strokeWidth={2.25} />
      </button>
      <button className="figdev__placed-device-delete" type="button" onClick={() => onDelete(placedDevice.instanceId)} aria-label={`Remove ${placedDevice.name}`} title="Remove device">
        <Trash2 size={13} strokeWidth={2.25} />
      </button>
      <button className="figdev__placed-device-resize" type="button" onPointerDown={beginResize} onPointerMove={resize} onPointerUp={() => { resizeOrigin.current = null }} aria-label={`Resize ${placedDevice.name}`} title="Resize device">
        <Maximize2 size={11} strokeWidth={2.5} />
      </button>
    </div>
  )
}

type AccordionKey = 'sources' | 'outputs' | 'processors' | 'settings'

function DeviceAccordion({
  title,
  devices,
  onDeviceClick,
  onDeviceDragStart,
  isOpen,
  isPinned,
  onToggle,
}: {
  title: string
  devices: DeviceSummary[]
  onDeviceClick: (device: DeviceSummary) => void
  onDeviceDragStart: (device: DeviceSummary, event: React.DragEvent<HTMLButtonElement>) => void
  isOpen: boolean
  isPinned: boolean
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
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
        onClick={onToggle}
      >
        <span>{title}{isPinned && <Pin className="figdev__accordion-pin" size={11} strokeWidth={2} aria-label="Pinned open" />}</span>
        <span className="figdev__device-group-chevron" ref={chevron}>-&gt;</span>
        <span className="figdev__accordion-tooltip" role="tooltip">
          {isPinned ? 'Click to unpin and close' : 'Alt/Option-click to pin open'}
        </span>
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
  isOpen,
  isPinned,
  onToggle,
}: {
  baseColor: string
  onColorChange: (color: string) => void
  isOpen: boolean
  isPinned: boolean
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
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
        onClick={onToggle}
      >
        <span>Settings{isPinned && <Pin className="figdev__accordion-pin" size={11} strokeWidth={2} aria-label="Pinned open" />}</span>
        <span className="figdev__settings-chevron" ref={chevron}>-&gt;</span>
        <span className="figdev__accordion-tooltip" role="tooltip">
          {isPinned ? 'Click to unpin and close' : 'Alt/Option-click to pin open'}
        </span>
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
  const [cables, setCables] = useState<PlacedCable[]>([])
  const [cableDraft, setCableDraft] = useState<CableDraft | null>(null)
  const [isStageDragOver, setIsStageDragOver] = useState(false)
  const stageSurface = useRef<HTMLDivElement>(null)
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>(null)
  const [pinnedAccordions, setPinnedAccordions] = useState<AccordionKey[]>([])
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

  const toggleAccordion = (key: AccordionKey, event: React.MouseEvent<HTMLButtonElement>) => {
    if (pinnedAccordions.includes(key)) {
      setPinnedAccordions((current) => current.filter((pinnedKey) => pinnedKey !== key))
      setOpenAccordion((current) => current === key ? null : current)
      return
    }

    if (event.altKey) {
      setPinnedAccordions((current) => [...current, key])
      setOpenAccordion(key)
      return
    }

    setOpenAccordion((current) => current === key ? null : key)
  }

  const isAccordionOpen = (key: AccordionKey) => (
    pinnedAccordions.includes(key) || openAccordion === key
  )

  const getPointerInStage = (event: React.PointerEvent) => {
    const bounds = stageSurface.current?.getBoundingClientRect()
    if (!bounds) return { x: event.clientX, y: event.clientY }
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  const beginCable = (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (port.direction === 'input') return

    setCableDraft({
      from: { deviceInstanceId: device.id, portId: port.id },
      sourcePort: port,
      pointer: getPointerInStage(event),
    })
  }

  const finishCable = (device: DeviceSummary, port: DeviceSummary['physicalPorts'][number], event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!cableDraft) return

    const target = { deviceInstanceId: device.id, portId: port.id }
    const endpointIsUsed = cables.some((cable) => (
      [cable.from, cable.to].some((endpoint) => endpoint.deviceInstanceId === target.deviceInstanceId && endpoint.portId === target.portId)
    ))
    const source = { ...cableDraft.sourcePort, deviceId: cableDraft.from.deviceInstanceId }
    if (cableDraft.from.deviceInstanceId === target.deviceInstanceId && cableDraft.from.portId === target.portId) {
      setCableDraft(null)
      return
    }

    if (!endpointIsUsed && canConnectAudioPorts(source, { ...port, deviceId: device.id })) {
      setCables((current) => [...current, {
        id: `cable-${Date.now()}`,
        from: cableDraft.from,
        to: target,
      }])
    }

    setCableDraft(null)
  }

  const updateCableDraft = (event: React.PointerEvent<HTMLDivElement>) => {
    if (cableDraft) setCableDraft({ ...cableDraft, pointer: getPointerInStage(event) })
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
              <DeviceAccordion title="Sources" devices={catalog.sources} isOpen={isAccordionOpen('sources')} isPinned={pinnedAccordions.includes('sources')} onToggle={(event) => toggleAccordion('sources', event)} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} />
              <DeviceAccordion title="Outputs" devices={catalog.outputs} isOpen={isAccordionOpen('outputs')} isPinned={pinnedAccordions.includes('outputs')} onToggle={(event) => toggleAccordion('outputs', event)} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} />
              <DeviceAccordion title="Process devices" devices={catalog.processors} isOpen={isAccordionOpen('processors')} isPinned={pinnedAccordions.includes('processors')} onToggle={(event) => toggleAccordion('processors', event)} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
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
        <SettingsPanel baseColor={baseColor} onColorChange={setBaseColor} isOpen={isAccordionOpen('settings')} isPinned={pinnedAccordions.includes('settings')} onToggle={(event) => toggleAccordion('settings', event)} />
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
          <div className="figdev__stage-surface" ref={stageSurface} onPointerMove={updateCableDraft} onPointerUp={() => setCableDraft(null)}>
            <span className="figdev__stage-label">STAGE / DRAG DEVICES HERE</span>
            <CableLayer
              cables={cables}
              draft={cableDraft}
              placedDevices={placedDevices}
              stageRef={stageSurface}
              onDeleteCable={(cableId) => setCables((current) => current.filter((cable) => cable.id !== cableId))}
            />
            {placedDevices.length > 0 ? placedDevices.map((device) => (
              <PlacedDeviceGraphic
                key={device.instanceId}
                placedDevice={device}
                onMove={(instanceId, x, y) => updatePlacedDevice(instanceId, { x, y })}
                onResize={(instanceId, width, height) => updatePlacedDevice(instanceId, { width, height })}
                onDelete={(instanceId) => setPlacedDevices((current) => current.filter((item) => item.instanceId !== instanceId))}
                onDetails={(deviceDetails) => deviceDetails.name === 'Audio Player' ? setIsSessionOpen(true) : setSelectedDevice(deviceDetails)}
                cableDraft={cableDraft}
                onPortPointerDown={beginCable}
                onPortPointerUp={finishCable}
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
