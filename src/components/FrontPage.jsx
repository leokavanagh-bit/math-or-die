export default function FrontPage({ onStart }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a0a00' }}>
      <button
        onClick={onStart}
        style={{ fontSize: '2rem', padding: '1rem 3rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' }}
      >
        FIGHT!
      </button>
    </div>
  )
}
