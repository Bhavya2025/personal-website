import { useEffect, useState } from 'react'
import { TerminalProvider } from './TerminalContext'
import Terminal from './Terminal'
import './devos.css'

/** Hardcoded Linux-style boot log, streamed before the shell appears. */
const BOOT_LOGS: string[] = [
  'GRUB loading stage2 ...',
  'Loading Linux 6.9.0-bk-amd64 ...',
  'Decompressing kernel image ... done.',
  '[ OK ] Mounted /dev/sda1 on /',
  '[ OK ] Started Kernel Logging Service',
  '[ OK ] Reached target Local File Systems',
  'Initializing memory allocator (heap=512M) ...',
  '[ OK ] Started udev Kernel Device Manager',
  '[ OK ] Loaded C/C++ toolchains (gcc 14.1, clang 18)',
  '[ OK ] Loaded Python 3.12 runtime',
  '[ OK ] Mounted /home/guest',
  'Bringing up network interface eth0 ...',
  '[ OK ] Network is online (10.0.0.42)',
  '[ OK ] Started OpenSSH Daemon',
  '[ OK ] Started bhavya-portfolio.service',
  'Starting interactive shell ...',
]

function BootLine({ text }: { text: string }) {
  const match = text.match(/^\[(.*?)\]\s?(.*)$/)
  if (match) {
    return (
      <div className="devos__line">
        <span className="devos__ok">[{match[1]}]</span> {match[2]}
      </div>
    )
  }
  return <div className="devos__line">{text}</div>
}

const prefersReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function DevOS({
  onExit,
  onProject,
}: {
  onExit: () => void
  onProject: (alias: string) => void
}) {
  // Reduced-motion users skip straight to the shell (no setState-in-effect).
  const [phase, setPhase] = useState<'boot' | 'shell'>(() =>
    prefersReduced() ? 'shell' : 'boot',
  )
  const [bootCount, setBootCount] = useState(() =>
    prefersReduced() ? BOOT_LOGS.length : 0,
  )

  // Take over the screen: lock page scroll while the OS is up.
  useEffect(() => {
    const body = document.body.style.overflow
    const html = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = body
      document.documentElement.style.overflow = html
    }
  }, [])

  // Boot sequence — stream logs, then clear into the shell after ~1.5s.
  useEffect(() => {
    if (prefersReduced()) return
    let i = 0
    const tick = window.setInterval(() => {
      i += 1
      setBootCount(i)
      if (i >= BOOT_LOGS.length) window.clearInterval(tick)
    }, 70)
    const done = window.setTimeout(() => setPhase('shell'), 1500)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [])

  return (
    <div className="devos" role="application" aria-label="Developer terminal">
      <div className="devos__glow" aria-hidden="true" />
      <div className="devos__scanlines" aria-hidden="true" />

      {phase === 'boot' ? (
        <div className="devos__screen">
          {BOOT_LOGS.slice(0, bootCount).map((line, i) => (
            <BootLine key={i} text={line} />
          ))}
        </div>
      ) : (
        <TerminalProvider onExit={onExit} onProject={onProject}>
          <Terminal />
        </TerminalProvider>
      )}
    </div>
  )
}

export default DevOS
