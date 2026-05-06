// components/homza/Logo.tsx
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="Homza" className="w-10 h-10" />
      <span className="text-xl font-bold text-slate-900">
        Homza
      </span>
    </div>
  )
}