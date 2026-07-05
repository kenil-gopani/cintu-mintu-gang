export default function Avatar({ src, name, size = 40, online = false, className = '' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const colors = ['#FF6B6B', '#4ECDC4', '#C3B1E1', '#FF8E53', '#A8E6CF', '#FFD700']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="avatar w-full h-full"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="avatar w-full h-full flex items-center justify-center font-extrabold text-white select-none"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})`,
            fontSize: size * 0.38,
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          className="online-dot absolute bottom-0 right-0"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  )
}
