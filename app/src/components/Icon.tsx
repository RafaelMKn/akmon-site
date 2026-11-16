const PATHS = {
  copy: <><rect x="8" y="8" width="12" height="12" /><path d="M4 16V4H16" /></>,
  check: <path d="M4 12.5L9.5 18L20 6.5" />,
  x: <path d="M5 5L19 19M19 5L5 19" />,
  out: <path d="M7 17L17 7M8 7H17V16" />,
  down: <path d="M12 4V19M6 13L12 19L18 13" />,
}

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="square">
      {PATHS[name]}
    </svg>
  )
}

/** Símbolo Akmon: bigorna + lâmina em brasa. `lamina` define a cor da lâmina. */
export function Simbolo({ lamina = '#B8340A' }: { lamina?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="block size-7">
      <path d="M4 20H60V30H46V36H52V50H58V56H12V50H18V36H26V30H18L4 22Z" fill="currentColor" />
      <g fill={lamina}>
        <rect x="16" y="12" width="30" height="8" />
        <rect x="22" y="5" width="4" height="4" />
        <rect x="31" y="2" width="4" height="4" />
        <rect x="40" y="6" width="4" height="4" />
      </g>
    </svg>
  )
}
