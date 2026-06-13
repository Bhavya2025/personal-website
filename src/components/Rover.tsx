import { useRef } from 'react'
import gsap from 'gsap'

/**
 * A little rover parked at the end of the projects list.
 * Click it — it has something to say.
 */
function Rover() {
  const antennaRef = useRef<SVGGElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef(0)

  const LINES = [
    'BEEP. VISITOR LOGGED.',
    'STILL OPERATIONAL. STILL ALONE.',
    'I WAS PROMISED A PLATFORMER DOWN HERE.',
    'OK STOP POKING ME.',
  ]

  const poke = () => {
    const line = LINES[Math.min(countRef.current, LINES.length - 1)] ?? LINES[0]!
    countRef.current++
    console.log(
      `%c🛰 ROVER-01: ${line}`,
      'color: #e07a4a; font-family: monospace; font-size: 12px;',
    )
    if (bubbleRef.current) {
      bubbleRef.current.textContent = line
      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25 },
      )
      gsap.to(bubbleRef.current, { opacity: 0, delay: 2.2, duration: 0.4 })
    }
    if (antennaRef.current) {
      gsap.fromTo(
        antennaRef.current,
        { rotate: 0 },
        {
          rotate: 14,
          duration: 0.12,
          repeat: 5,
          yoyo: true,
          transformOrigin: '20% 100%',
          ease: 'none',
        },
      )
    }
  }

  return (
    <div className="rover">
      <span className="rover__bubble" ref={bubbleRef} aria-live="polite" />
      <button
        type="button"
        className="rover__body"
        onClick={poke}
        aria-label="A small rover. Click it."
      >
        <svg viewBox="0 0 80 50" width="80" height="50" aria-hidden="true">
          {/* antenna */}
          <g ref={antennaRef}>
            <line x1="22" y1="22" x2="14" y2="6" stroke="var(--bone-dim)" strokeWidth="1.5" />
            <circle cx="14" cy="6" r="2.5" fill="var(--amber)" />
          </g>
          {/* mast camera */}
          <rect x="30" y="10" width="3" height="14" fill="var(--bone-dim)" />
          <rect x="26" y="6" width="11" height="6" rx="1" fill="var(--bone)" />
          <circle cx="34.5" cy="9" r="1.6" fill="var(--ink)" />
          {/* body */}
          <rect x="16" y="22" width="42" height="12" rx="2" fill="var(--bone)" />
          <rect x="20" y="25" width="10" height="5" fill="var(--amber)" opacity="0.85" />
          {/* solar panel */}
          <rect x="44" y="16" width="26" height="7" rx="1" fill="#5b81a8" transform="rotate(-8 44 16)" />
          {/* wheels */}
          <circle cx="22" cy="40" r="6" fill="#2c2c30" stroke="var(--bone-dim)" strokeWidth="1.5" />
          <circle cx="38" cy="40" r="6" fill="#2c2c30" stroke="var(--bone-dim)" strokeWidth="1.5" />
          <circle cx="54" cy="40" r="6" fill="#2c2c30" stroke="var(--bone-dim)" strokeWidth="1.5" />
        </svg>
      </button>
      <span className="rover__caption">ROVER-01</span>
    </div>
  )
}

export default Rover
