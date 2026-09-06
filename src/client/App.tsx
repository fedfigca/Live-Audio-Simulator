import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
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

function DeviceAccordion({
  title,
  devices,
}: {
  title: string
  devices: DeviceSummary[]
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
            <div className="figdev__device" key={device.id}>
              <strong>{device.name}</strong>
              <small>{formatPortSummary(device)}</small>
            </div>
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [catalog, setCatalog] = useState<DeviceCatalog | null>(null)
  const [catalogError, setCatalogError] = useState(false)
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
              <DeviceAccordion title="Sources" devices={catalog.sources} />
              <DeviceAccordion title="Outputs" devices={catalog.outputs} />
              <DeviceAccordion title="Process devices" devices={catalog.processors} />
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
            <p className="figdev__eyebrow">Live Audio Simulator</p>
            <h1>Shape the signal.</h1>
          </div>
          <div className="figdev__connection-status">
            <span className="figdev__status-dot" />
            <span>Local session</span>
          </div>
        </header>

        <section className="figdev__studio" aria-label="Audio studio">
          <div className="figdev__visualizer-panel figdev__reveal">
            <div className="figdev__panel-heading">
              <div>
                <p className="figdev__eyebrow">Now simulating</p>
                <h2>Late Night Transit</h2>
              </div>
              <span className="figdev__timecode">02:14 / 03:42</span>
            </div>
            <div className={`figdev__visualizer ${isPlaying ? 'figdev__visualizer--playing' : ''}`} aria-label="Audio waveform visualization">
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
          </div>

          <div className="figdev__mixer-panel figdev__reveal">
            <div className="figdev__panel-heading">
              <div>
                <p className="figdev__eyebrow">Signal chain</p>
                <h2>Live mixer</h2>
              </div>
              <span className="figdev__live-label">LIVE</span>
            </div>
            <div className="figdev__mixer-control">
              <div className="figdev__mixer-control-label"><span>Atmosphere</span><strong>68</strong></div>
              <div className="figdev__meter"><span style={{ width: '68%' }} /></div>
            </div>
            <div className="figdev__mixer-control">
              <div className="figdev__mixer-control-label"><span>Low end</span><strong>42</strong></div>
              <div className="figdev__meter"><span style={{ width: '42%' }} /></div>
            </div>
            <div className="figdev__mixer-control">
              <div className="figdev__mixer-control-label"><span>Presence</span><strong>81</strong></div>
              <div className="figdev__meter"><span style={{ width: '81%' }} /></div>
            </div>
            <button className="figdev__mixer-button" type="button">Open channel rack <span>+</span></button>
          </div>
        </section>

        <section className="figdev__library figdev__reveal" id="library">
          <div className="figdev__section-heading">
            <div>
              <p className="figdev__eyebrow">Source material</p>
              <h2>Session library</h2>
            </div>
            <button className="figdev__text-button" type="button">View all <span>-&gt;</span></button>
          </div>
          <div className="figdev__track-list">
            {tracks.map((track, index) => (
              <button className={`figdev__track ${index === 0 ? 'figdev__track--active' : ''}`} key={track.name} type="button">
                <span className="figdev__track-number">0{index + 1}</span>
                <span className="figdev__track-name">{track.name}<small>{track.artist}</small></span>
                <span className="figdev__track-duration">{track.duration}</span>
                <span className="figdev__track-arrow">-&gt;</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
