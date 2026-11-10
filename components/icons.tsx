import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconHoy(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function IconEntrenar(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
    </svg>
  );
}

export function IconComer(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 3v18M4.5 3v5a2.5 2.5 0 0 0 5 0V3M17.5 21V3c-2.2 0-3.5 2.8-3.5 7h3.5" />
    </svg>
  );
}

export function IconProgreso(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20h16M5 15.5l4.5-4.5 3.5 3.5L19.5 8" />
    </svg>
  );
}

export function IconDatos(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

export function IconPlay(p: IconProps) {
  return (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

export function IconPerfil(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </svg>
  );
}

export function IconLuna(p: IconProps) {
  return (
    <svg {...base(p)} strokeWidth={2.2}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function IconPulso(p: IconProps) {
  return (
    <svg {...base(p)} strokeWidth={2.2}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

export function IconAlerta(p: IconProps) {
  return (
    <svg {...base(p)} strokeWidth={2.4}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2v.3" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)} strokeWidth={2.6}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
