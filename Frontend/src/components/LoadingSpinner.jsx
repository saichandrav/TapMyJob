export default function LoadingSpinner({ className = '', size = 48 }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
    >
      <div className="absolute inset-0 rounded-full border border-border" />
      <div className="absolute inset-1 rounded-full border border-primary/40" />
      <div className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-primary animate-spin" />
      <div className="absolute h-2 w-2 rounded-full bg-secondary shadow-[0_0_14px_rgba(0,217,163,0.5)]" />
    </div>
  )
}
