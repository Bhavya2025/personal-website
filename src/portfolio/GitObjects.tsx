import { useState } from 'react'

const objects = [
  { id: 'ref', name: 'main', type: 'Reference', code: 'refs/heads/main → commit ID', description: 'A branch name holds a commit ID. New commits move this pointer; the objects already stored remain unchanged.' },
  { id: 'commit', name: 'commit', type: 'History', code: 'tree ID + parent IDs + metadata', description: 'A commit identifies a tree, records its parent commit IDs, and carries author metadata and a message.' },
  { id: 'tree', name: 'tree', type: 'Directory', code: 'mode + filename + object ID', description: 'A tree connects filenames and file modes to blobs or other trees. It describes a directory, rather than storing the file contents itself.' },
  { id: 'blob', name: 'blob', type: 'Contents', code: 'file bytes → content-addressed object', description: 'A blob stores file contents. Its filename belongs to the tree. Identical content produces the same object ID.' },
] as const

export default function GitObjects() {
  const [active, setActive] = useState<(typeof objects)[number]['id']>('tree')
  const selected = objects.find(object => object.id === active)!
  return (
    <figure className="object-figure">
      <figcaption><span>Inside Wyag</span><span>01 / Object relationships</span></figcaption>
      <div className="object-flow" role="group" aria-label="Inspect Git object types">
        {objects.map((object, index) => (
          <div className="object-step" key={object.id}>
            <button type="button" aria-pressed={active === object.id} onClick={() => setActive(object.id)} aria-controls="object-explanation">
              <span className="object-symbol" aria-hidden="true">{object.id === 'ref' ? '↗' : object.id === 'commit' ? '○' : object.id === 'tree' ? '⑂' : '{ }'}</span>
              <strong>{object.name}</strong><span>{object.type}</span>
            </button>
            {index < objects.length - 1 && <span className="object-connector" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
      <div className="object-explanation" id="object-explanation" aria-live="polite" aria-atomic="true"><code>{selected.code}</code><p>{selected.description}</p></div>
      <p className="figure-note">Conceptual example. Select an object to inspect the relationship.</p>
    </figure>
  )
}
