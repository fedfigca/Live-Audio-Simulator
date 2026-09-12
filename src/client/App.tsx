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
  Moon,
  SlidersHorizontal,
  Pin,
  Speaker,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useDraggable from './hooks/useDraggable'
import type { LucideIcon } from 'lucide-react'
import type { DeviceCatalog, DeviceSummary } from '../simulation/application/catalog/DeviceCatalog'
import DeviceFullInfo from './DeviceFullInfo'
import { canConnectAudioPorts } from '../simulation/domain/stage/entities/cables/ConnectionService'

const tracks = [
  { name: 'Late Night Transit', artist: 'Signal Bloom', duration: '03:42' },
  { name: 'Glass Elevators', artist: 'Mira Vale', duration: '04:18' },
  { name: 'Soft Focus', artist: 'North Arcade', duration: '02:56' },
]

const COLOR_STORAGE_KEY = 'figdev-base-color'
const THEME_STORAGE_KEY = 'figdev-theme'
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
  fromDir?: Point
  toDir?: Point
}

type CableDraft = {
  from: CableEndpoint
  sourcePort: DeviceSummary['physicalPorts'][number]
  pointer: { x: number; y: number }
}

function getDefaultDeviceSize(device: DeviceSummary): { width: number; height: number } {
  // Compact defaults (percent of stage) to match compact screenshot
  if (device.name === 'Mixer') {
    return { width: 14, height: 12 }
  }

  if (device.name === 'Audio Player') {
    return { width: 12, height: 10 }
  }

  return { width: 10, height: 8 }
}

export function formatPortSummary(device: DeviceSummary): string {
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

// outward normal a cable must leave/enter along, derived from the port's actual
// position on the device rect (not its electrical direction), so it never dives
// back under the device regardless of which side a device places its ports on
function outwardDirectionFromRect(portCenter: Point, deviceRect: Rect): Point {
  const centerX = (deviceRect.left + deviceRect.right) / 2
  const centerY = (deviceRect.top + deviceRect.bottom) / 2
  const halfWidth = (deviceRect.right - deviceRect.left) / 2 || 1
  const halfHeight = (deviceRect.bottom - deviceRect.top) / 2 || 1
  const nx = (portCenter.x - centerX) / halfWidth
  const ny = (portCenter.y - centerY) / halfHeight

  return Math.abs(nx) >= Math.abs(ny)
    ? { x: nx >= 0 ? 1 : -1, y: 0 }
    : { x: 0, y: ny >= 0 ? 1 : -1 }
}

const CABLE_STUB = 20

function dedupePoints(points: Point[]): Point[] {
  return points.filter((point, index) => (
    index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y
  ))
}

/**
 * Routes a cable so it always leaves/enters perpendicular to its ports: a short
 * straight stub clears the device, then the path turns as many times as needed.
 */
function createCablePath(
  start: Point,
  startDir: Point,
  end: Point,
  endDir: Point | null,
  obstacles: Rect[],
  width: number,
  height: number,
  startDeviceId: string | null = null,
  endDeviceId: string | null = null,
): string {
  // Always build explicit perpendicular stubs first
  const stubStart = { x: start.x + startDir.x * CABLE_STUB, y: start.y + startDir.y * CABLE_STUB }
  const stubEnd = endDir ? { x: end.x + endDir.x * CABLE_STUB, y: end.y + endDir.y * CABLE_STUB } : end

  // Move stubs just outside their device rectangles if possible
  const padding = 8
  const startObstacle = startDeviceId ? obstacles.find((o) => o.deviceInstanceId === startDeviceId) : undefined
  if (startObstacle) {
    const expanded = { left: startObstacle.left - padding, top: startObstacle.top - padding, right: startObstacle.right + padding, bottom: startObstacle.bottom + padding }
    if (startDir.x > 0) stubStart.x = Math.max(stubStart.x, expanded.right)
    if (startDir.x < 0) stubStart.x = Math.min(stubStart.x, expanded.left)
    if (startDir.y > 0) stubStart.y = Math.max(stubStart.y, expanded.bottom)
    if (startDir.y < 0) stubStart.y = Math.min(stubStart.y, expanded.top)
  }
  const endObstacle = endDeviceId ? obstacles.find((o) => o.deviceInstanceId === endDeviceId) : undefined
  if (endObstacle && endDir) {
    const expanded = { left: endObstacle.left - padding, top: endObstacle.top - padding, right: endObstacle.right + padding, bottom: endObstacle.bottom + padding }
    if (endDir.x > 0) stubEnd.x = Math.max(stubEnd.x, expanded.right)
    if (endDir.x < 0) stubEnd.x = Math.min(stubEnd.x, expanded.left)
    if (endDir.y > 0) stubEnd.y = Math.max(stubEnd.y, expanded.bottom)
    if (endDir.y < 0) stubEnd.y = Math.min(stubEnd.y, expanded.top)
  }

  // Grid-based A* router (4-connected Manhattan) on coarse grid to avoid obstacles reliably
  const cellSize = 8
  const cols = Math.max(3, Math.ceil(width / cellSize))
  const rows = Math.max(3, Math.ceil(height / cellSize))

  const toCell = (p: Point) => ({ x: Math.max(0, Math.min(cols - 1, Math.floor(p.x / cellSize))), y: Math.max(0, Math.min(rows - 1, Math.floor(p.y / cellSize))) })
  const toPointCenter = (c: { x: number; y: number }) => ({ x: c.x * cellSize + cellSize / 2, y: c.y * cellSize + cellSize / 2 })

  const blocked = new Array(rows).fill(0).map(() => new Array(cols).fill(false))
  const pad = 6
  for (const obs of obstacles) {
    const left = Math.max(0, Math.floor((obs.left - pad) / cellSize))
    const right = Math.min(cols - 1, Math.floor((obs.right + pad) / cellSize))
    const top = Math.max(0, Math.floor((obs.top - pad) / cellSize))
    const bottom = Math.min(rows - 1, Math.floor((obs.bottom + pad) / cellSize))
    for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) blocked[r][c] = true
  }

  const startCell = toCell(stubStart)
  const endCell = toCell(stubEnd)

  // Ensure stub cells are not blocked; if they are, nudge them outward along stub direction
  const nudge = (cell: { x: number; y: number }, dir: Point) => {
    let cx = cell.x, cy = cell.y
    for (let i = 0; i < 6 && blocked[cy] && blocked[cy][cx]; i++) {
      cx = Math.max(0, Math.min(cols - 1, cx + Math.sign(dir.x)))
      cy = Math.max(0, Math.min(rows - 1, cy + Math.sign(dir.y)))
    }
    return { x: cx, y: cy }
  }

  const sCell = nudge(startCell, startDir)
  const eCell = endDir ? nudge(endCell, endDir) : endCell

  function astar(s: { x: number; y: number }, t: { x: number; y: number }) {
    const key = (p: { x: number; y: number }) => `${p.x},${p.y}`
    const open = new Map<string, { x: number; y: number }>()
    const came = new Map<string, string>()
    const gscore = new Map<string, number>()
    const fscore = new Map<string, number>()
    const h = (p: { x: number; y: number }) => Math.abs(p.x - t.x) + Math.abs(p.y - t.y)
    open.set(key(s), s)
    gscore.set(key(s), 0)
    fscore.set(key(s), h(s))

    while (open.size) {
      // pop lowest fscore
      let currentKey: string | null = null
      let current: { x: number; y: number } | null = null
      let best = Infinity
      for (const [k, v] of open) {
        const f = fscore.get(k) ?? Infinity
        if (f < best) { best = f; currentKey = k; current = v }
      }
      if (!current || !currentKey) break
      if (current.x === t.x && current.y === t.y) {
        // reconstruct
        const path: { x: number; y: number }[] = []
        let k = currentKey
        while (k) {
          const [cx, cy] = k.split(',').map(Number)
          path.push({ x: cx, y: cy })
          k = came.get(k) ?? ''
        }
        return path.reverse()
      }

      open.delete(currentKey)
      const neighbors = [ { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y }, { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 } ]
      for (const n of neighbors) {
        if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows) continue
        if (blocked[n.y][n.x] && !(n.x === t.x && n.y === t.y)) continue
        const nk = key(n)
        const tentative = (gscore.get(currentKey) ?? Infinity) + 1
        if (tentative < (gscore.get(nk) ?? Infinity)) {
          came.set(nk, currentKey)
          gscore.set(nk, tentative)
          fscore.set(nk, tentative + h(n))
          open.set(nk, n)
        }
      }
    }
    return null
  }

  const gridPath = astar(sCell, eCell)
  if (gridPath && gridPath.length > 0) {
    // convert grid centers to points and compress orthogonal turns
    const pts = gridPath.map(toPointCenter)
    const routePoints: Point[] = [start, stubStart, ...pts, stubEnd, end]
    const compressed: Point[] = dedupePoints(routePoints).filter(Boolean)
    return compressed.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  // fallback to earlier simple bending candidates if grid router fails
  const middleX = (stubStart.x + stubEnd.x) / 2
  const middleY = (stubStart.y + stubEnd.y) / 2
  const aligned = stubStart.x === stubEnd.x || stubStart.y === stubEnd.y
  const bendCandidates: Point[][] = aligned ? [[]] : [ [{ x: middleX, y: stubStart.y }, { x: middleX, y: stubEnd.y }], [{ x: stubStart.x, y: middleY }, { x: stubEnd.x, y: middleY }], [{ x: stubStart.x, y: 24 }, { x: stubEnd.x, y: 24 }], [{ x: stubStart.x, y: height - 24 }, { x: stubEnd.x, y: height - 24 }], [{ x: 24, y: stubStart.y }, { x: 24, y: stubEnd.y }], [{ x: width - 24, y: stubStart.y }, { x: width - 24, y: stubEnd.y }] ]
  const candidatePaths = bendCandidates.map((bend) => dedupePoints([start, stubStart, ...bend, stubEnd, end]))
  const route = candidatePaths.find((candidate) => !obstacles.some((obstacle) => segmentsHitRect(candidate, obstacle))) ?? candidatePaths[0]
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
    const getPortDirection = (endpoint: CableEndpoint): Point => {
      // Compute the actual port center and derive the outward normal from the
      // device rectangle. This is more robust than relying on CSS classnames.
      const portEl = stage.querySelector<HTMLElement>(`[data-device-instance="${endpoint.deviceInstanceId}"][data-port-id="${endpoint.portId}"]`)
      if (portEl) {
        const portBounds = portEl.getBoundingClientRect()
        const portCenter = { x: portBounds.left + portBounds.width / 2 - stageBounds.left, y: portBounds.top + portBounds.height / 2 - stageBounds.top }
        const deviceRect = obstacles.find((item) => item.deviceInstanceId === endpoint.deviceInstanceId)
        if (deviceRect) return outwardDirectionFromRect(portCenter, deviceRect)
      }

      const point = getPoint(endpoint)
      const deviceRect = obstacles.find((item) => item.deviceInstanceId === endpoint.deviceInstanceId)
      return point && deviceRect ? outwardDirectionFromRect(point, deviceRect) : { x: 1, y: 0 }
    }

      const nextPaths: CablePath[] = cables.flatMap((cable) => {
      const start = getPoint(cable.from)
      const end = getPoint(cable.to)
      if (!start || !end) return []
      const cableObstacles = obstacles
      return [{
        id: cable.id,
        path: createCablePath(
          start,
          // prefer stored directions on the placed cable so stubs are stable
          cable.fromDir ?? getPortDirection(cable.from),
          end,
          cable.toDir ?? getPortDirection(cable.to),
          cableObstacles,
          stageBounds.width,
          stageBounds.height,
          cable.from.deviceInstanceId,
          cable.to.deviceInstanceId,
        ),
        anchor: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        color: cableColor(cable.from),
      }]
    })

    if (draft) {
      const start = getPoint(draft.from)
      if (start) {
        nextPaths.push({
          id: 'draft',
          path: createCablePath(
            start,
            getPortDirection(draft.from),
            draft.pointer,
            null,
            obstacles,
            stageBounds.width,
            stageBounds.height,
            draft.from.deviceInstanceId,
            null,
          ),
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

type PortSide = 'left' | 'right' | 'top' | 'bottom'

// where each port type is drawn on the device rectangle; Mixer flips the usual left/right layout
function getPortSide(deviceName: string, direction: string): PortSide {
  if (deviceName === 'Mixer') {
    if (direction === 'output') return 'top'
    return 'bottom'
  }
  if (direction === 'output') return 'right'
  if (direction === 'input') return 'left'
  return 'bottom'
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
  const portsBySide: Record<PortSide, typeof physicalPorts> = { left: [], right: [], top: [], bottom: [] }
  physicalPorts.forEach((port) => {
    portsBySide[getPortSide(device.name, port.direction)].push(port)
  })

  const renderPort = (port: typeof physicalPorts[number], side: PortSide) => {
    const type = port.direction
    const isSource = cableDraft?.from.deviceInstanceId === deviceInstanceId && cableDraft.from.portId === port.id
    const isTarget = Boolean(cableDraft && !isSource && canConnectAudioPorts(
      { ...cableDraft.sourcePort, deviceId: cableDraft.from.deviceInstanceId },
      { ...port, deviceId: deviceInstanceId },
    ))

    return (
    <button
      className={`figdev__port-wrap figdev__port-wrap--${side} ${isSource ? 'figdev__port-wrap--active' : ''} ${isTarget ? 'figdev__port-wrap--target' : ''}`}
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
        {portsBySide.left.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--left">
          {portsBySide.left.map((port) => renderPort(port, 'left'))}
        </span>}
        {portsBySide.top.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--top">
          {portsBySide.top.map((port) => renderPort(port, 'top'))}
        </span>}
        {portsBySide.bottom.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--bottom">
          {portsBySide.bottom.map((port) => renderPort(port, 'bottom'))}
        </span>}
        {portsBySide.right.length > 0 && <span className="figdev__generic-device-ports figdev__generic-device-ports--right">
          {portsBySide.right.map((port) => renderPort(port, 'right'))}
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

// Small helper component so each device can attach hooks safely
function DeviceItem({
  device,
  onDeviceClick,
  onDeviceDragStart,
  onDevicePointerDrop,
}: {
  device: DeviceSummary
  onDeviceClick: (device: DeviceSummary) => void
  onDeviceDragStart: (device: DeviceSummary, event: React.DragEvent<HTMLButtonElement>) => void
  onDevicePointerDrop: (device: DeviceSummary, clientX: number, clientY: number) => void
}) {
  const dragHandlers = useDraggable(device, { longPress: 220, onDrop: (d, x, y) => onDevicePointerDrop(d, x, y) })

  return (
    <button
      className="figdev__device"
      type="button"
      draggable
      onClick={() => onDeviceClick(device)}
      onDragStart={(event) => onDeviceDragStart(device, event)}
      {...dragHandlers}
    >
      <strong>{device.name}</strong>
      <small>{formatPortSummary(device)}</small>
    </button>
  )
}

function DeviceAccordion({
  title,
  devices,
  onDeviceClick,
  onDeviceDragStart,
  onDevicePointerDrop,
  isOpen,
  isPinned,
  onToggle,
}: {
  title: string
  devices: DeviceSummary[]
  onDeviceClick: (device: DeviceSummary) => void
  onDeviceDragStart: (device: DeviceSummary, event: React.DragEvent<HTMLButtonElement>) => void
  onDevicePointerDrop: (device: DeviceSummary, clientX: number, clientY: number) => void
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
            <DeviceItem
              key={device.id}
              device={device}
              onDeviceClick={onDeviceClick}
              onDeviceDragStart={onDeviceDragStart}
              onDevicePointerDrop={onDevicePointerDrop}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function SettingsPanel({
  baseColor,
  onColorChange,
  theme,
  onThemeChange,
  isOpen,
  isPinned,
  onToggle,
}: {
  baseColor: string
  onColorChange: (color: string) => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
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
          <button
            className="figdev__theme-toggle"
            type="button"
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Moon size={13} strokeWidth={2} /> : <Sun size={13} strokeWidth={2} />}
            <span>{theme === 'dark' ? 'Dark theme' : 'Light theme'}</span>
          </button>
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
  const [dragPreview, setDragPreview] = useState<{ device: DeviceSummary; x: number; y: number; width: number; height: number } | null>(null)
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>(null)
  const [pinnedAccordions, setPinnedAccordions] = useState<AccordionKey[]>([])
  const [baseColor, setBaseColor] = useState(() => (
    localStorage.getItem(COLOR_STORAGE_KEY) ?? COLOR_PRESETS[0].value
  ))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  ))

  useEffect(() => {
    document.documentElement.style.setProperty('--figdev-base-color', baseColor)
    localStorage.setItem(COLOR_STORAGE_KEY, baseColor)
  }, [baseColor])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    fetch('/api/devices')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load device catalog')
        return response.json() as Promise<DeviceCatalog>
      })
      .then(setCatalog)
      .catch(() => setCatalogError(true))
  }, [])

  // Listen for custom drag events from `useDraggable` so the stage highlights on touch drags
  useEffect(() => {
    let prevTouchAction: string | null = null

    const onDragMove = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail
      if (!detail || !stageSurface.current) return
      const { clientX, clientY, payload } = detail
      const bounds = stageSurface.current.getBoundingClientRect()
      const inside = clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom
      setIsStageDragOver(inside)

      // compute preview placement in percent
      try {
        const dev = payload as DeviceSummary
        const defaultSize = getDefaultDeviceSize(dev)
        const dropX = ((clientX - bounds.left) / bounds.width) * 100
        const dropY = ((clientY - bounds.top) / bounds.height) * 100
        const x = Math.max(0, Math.min(100 - defaultSize.width, dropX - defaultSize.width / 2))
        const y = Math.max(0, Math.min(100 - defaultSize.height, dropY - defaultSize.height / 2))
        setDragPreview({ device: dev, x, y, width: defaultSize.width, height: defaultSize.height })
      } catch (e) {
        setDragPreview(null)
      }
    }

    const onDragStart = (ev: Event) => {
      // prevent passive touch scrolling on the stage while dragging
      if (stageSurface.current) {
        prevTouchAction = stageSurface.current.style.touchAction ?? ''
        stageSurface.current.style.touchAction = 'none'
      }
      onDragMove(ev)
    }

    const onDragEnd = () => {
      setIsStageDragOver(false)
      setDragPreview(null)
      if (stageSurface.current) stageSurface.current.style.touchAction = ''
    }

    window.addEventListener('figdev-dragmove', onDragMove as EventListener)
    window.addEventListener('figdev-dragstart', onDragStart as EventListener)
    window.addEventListener('figdev-dragend', onDragEnd as EventListener)

    return () => {
      window.removeEventListener('figdev-dragmove', onDragMove as EventListener)
      window.removeEventListener('figdev-dragstart', onDragStart as EventListener)
      window.removeEventListener('figdev-dragend', onDragEnd as EventListener)
      if (stageSurface.current) stageSurface.current.style.touchAction = prevTouchAction ?? ''
    }
  }, [stageSurface])

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

    // place using shared helper (works for drag events and touch/pointer fallbacks)
    placeDeviceAt(device, event.clientX, event.clientY)
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

  // Place a device on the stage given client coordinates (shared for native drag and touch fallbacks)
  const placeDeviceAt = (device: DeviceSummary, clientX: number, clientY: number) => {
    const defaultSize = getDefaultDeviceSize(device)
    const bounds = stageSurface.current?.getBoundingClientRect()
    const dropX = bounds ? ((clientX - bounds.left) / bounds.width) * 100 : 8
    const dropY = bounds ? ((clientY - bounds.top) / bounds.height) * 100 : 12
    const x = Math.max(0, Math.min(100 - defaultSize.width, dropX - defaultSize.width / 2))
    const y = Math.max(0, Math.min(100 - defaultSize.height, dropY - defaultSize.height / 2))

    setPlacedDevices((current) => [
      ...current,
      {
        ...device,
        instanceId: `${device.id}-${Date.now()}`,
        x,
        y,
        width: defaultSize.width,
        height: defaultSize.height,
      },
    ])
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
      // capture the current stub directions so they remain stable even if
      // devices move later. Use the rendered port element's side class when
      // available, otherwise fall back to geometric outward normal.
      const resolvePortDirectionInApp = (endpoint: CableEndpoint): Point => {
        const stage = stageSurface.current
        if (!stage) return { x: 1, y: 0 }
        const portEl = stage.querySelector<HTMLElement>(`[data-device-instance="${endpoint.deviceInstanceId}"][data-port-id="${endpoint.portId}"]`)
        if (portEl) {
          const portBounds = portEl.getBoundingClientRect()
          const stageBounds = stage.getBoundingClientRect()
          const portCenter = { x: portBounds.left + portBounds.width / 2 - stageBounds.left, y: portBounds.top + portBounds.height / 2 - stageBounds.top }
          const deviceEl = stage.querySelector<HTMLElement>(`[data-device-instance="${endpoint.deviceInstanceId}"]`)
          if (deviceEl) {
            const bounds = deviceEl.getBoundingClientRect()
            const deviceRect: Rect = { left: bounds.left - stageBounds.left, top: bounds.top - stageBounds.top, right: bounds.right - stageBounds.left, bottom: bounds.bottom - stageBounds.top, deviceInstanceId: endpoint.deviceInstanceId }
            return outwardDirectionFromRect(portCenter, deviceRect)
          }
        }

        const deviceEl = stage.querySelector<HTMLElement>(`[data-device-instance="${endpoint.deviceInstanceId}"]`)
        if (!deviceEl) return { x: 1, y: 0 }
        const bounds = deviceEl.getBoundingClientRect()
        const stageBounds = stage.getBoundingClientRect()
        const point = { x: bounds.left + bounds.width / 2 - stageBounds.left, y: bounds.top + bounds.height / 2 - stageBounds.top }
        const deviceRect: Rect = { left: bounds.left - stageBounds.left, top: bounds.top - stageBounds.top, right: bounds.right - stageBounds.left, bottom: bounds.bottom - stageBounds.top, deviceInstanceId: endpoint.deviceInstanceId }
        return outwardDirectionFromRect(point, deviceRect)
      }

      setCables((current) => [...current, {
        id: `cable-${Date.now()}`,
        from: cableDraft.from,
        to: target,
        fromDir: resolvePortDirectionInApp(cableDraft.from),
        toDir: resolvePortDirectionInApp(target),
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
              }} onDevicePointerDrop={placeDeviceAt} />
              <DeviceAccordion title="Outputs" devices={catalog.outputs} isOpen={isAccordionOpen('outputs')} isPinned={pinnedAccordions.includes('outputs')} onToggle={(event) => toggleAccordion('outputs', event)} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} onDevicePointerDrop={placeDeviceAt} />
              <DeviceAccordion title="Process devices" devices={catalog.processors} isOpen={isAccordionOpen('processors')} isPinned={pinnedAccordions.includes('processors')} onToggle={(event) => toggleAccordion('processors', event)} onDeviceClick={setSelectedDevice} onDeviceDragStart={(device, event) => {
                event.dataTransfer.setData('application/x-figdev-device', device.id)
                event.dataTransfer.effectAllowed = 'copy'
              }} onDevicePointerDrop={placeDeviceAt} />
            </>
          ) : (
            <p className="figdev__device-browser-status">
              {catalogError ? 'Catalog unavailable' : 'Loading catalog...'}
            </p>
          )}
        </div>
        <SettingsPanel baseColor={baseColor} onColorChange={setBaseColor} theme={theme} onThemeChange={setTheme} isOpen={isAccordionOpen('settings')} isPinned={pinnedAccordions.includes('settings')} onToggle={(event) => toggleAccordion('settings', event)} />
        <p className="figdev__sidebar-footer">Build 0.1.0</p>
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
            {dragPreview && (
              <div
                className="figdev__stage-preview"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${dragPreview.x}%`,
                  top: `${dragPreview.y}%`,
                  width: `${dragPreview.width}%`,
                  height: `${dragPreview.height}%`,
                  border: '2px dashed rgba(0,0,0,0.18)',
                  background: 'rgba(0,0,0,0.02)',
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              />
            )}
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
      <DeviceFullInfo device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      {isSessionOpen && <SessionModal onClose={() => setIsSessionOpen(false)} />}
    </div>
  )
}

export default App
