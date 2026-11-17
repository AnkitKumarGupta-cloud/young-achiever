import type { SVGProps } from 'react';

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c.8-3.6 3.8-5.4 7.5-5.4s6.7 1.8 7.5 5.4" />
  </svg>
);
export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
    <path d="M8.3 10.5V8a3.7 3.7 0 0 1 7.4 0v2.5" />
    <circle cx="12" cy="15.2" r="1.1" />
  </svg>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);
export const EyeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 4M6.4 7.4C3.9 9 2.5 12 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.3 3.6-.8" />
    <path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 3.7" />
  </svg>
);
export const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);
export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 3 4.5 6v5.6c0 4.4 3 8 7.5 9.4 4.5-1.4 7.5-5 7.5-9.4V6L12 3Z" />
    <path d="m8.8 12 2.3 2.3 4.2-4.4" />
  </svg>
);
export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  </svg>
);
export const PeopleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.5c.6-3.3 3-5 6.2-5s5.6 1.7 6.2 5" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M17.2 14.3c2.4.1 3.9 1.5 4.4 4" />
  </svg>
);
export const KeyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="15" r="3.8" />
    <path d="m10.8 12.2 8.7-8.7M16 7l2.5 2.5M13.5 9.5 15.5 11.5" />
  </svg>
);

/** A simple original crown mark in the site's gold. */
export function Crown({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 50 40" aria-hidden="true">
      <path d="M5 31 2.5 11l11 8.5L25 5l11.5 14.5L47.5 11 45 31Z" fill="#c9a24a" />
      <rect x="6" y="33" width="38" height="4.5" rx="2.2" fill="#c9a24a" />
      <circle cx="2.5" cy="9.5" r="2.4" fill="#c9a24a" />
      <circle cx="25" cy="3.6" r="2.6" fill="#c9a24a" />
      <circle cx="47.5" cy="9.5" r="2.4" fill="#c9a24a" />
      <circle cx="25" cy="27" r="2" fill="#16211b" opacity=".35" />
    </svg>
  );
}

export const DocIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.2" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </svg>
);
export const TrophyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0V4Z" />
    <path d="M7.5 6H4.5c0 3 1.2 4.5 3.3 4.8M16.5 6h3c0 3-1.2 4.5-3.3 4.8M12 13.5V17M8.5 20h7M10 17h4" />
  </svg>
);
export const ShareIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="6.5" cy="12" r="2.3" />
    <circle cx="17" cy="6" r="2.3" />
    <circle cx="17" cy="18" r="2.3" />
    <path d="m8.5 10.9 6.4-3.7M8.5 13.1l6.4 3.7" />
  </svg>
);

export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);
export const PenIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z" />
  </svg>
);
export const HelpIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 16.6v.1" />
  </svg>
);

/** Brand mark: a medal-yellow star on a royal-blue tile. */
export const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo">
    <rect width="32" height="32" rx="9" fill="#3047F5" />
    <path d="M16 6.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L16 21.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" fill="#FFC233" />
  </svg>
);
