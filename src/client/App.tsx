import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

const tracks = [
  { name: 'Late Night Transit', artist: 'Signal Bloom', duration: '03:42' },
  { name: 'Glass Elevators', artist: 'Mira Vale', duration: '04:18' },
  { name: 'Soft Focus', artist: 'North Arcade', duration: '02:56' },
]

function App() {
  const container = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
