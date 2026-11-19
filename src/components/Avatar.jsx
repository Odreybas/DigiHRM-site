export default function Avatar({ p, size = 44 }) {
  const name = (p?.full_name || '?').trim()
  if (p?.avatar_url) {
    return <img className="avatar" style={{ width: size, height: size }} src={p.avatar_url} alt="" loading="lazy" />
  }
  return (
    <span className="avatar ph" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
