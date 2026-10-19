interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

// Logo: pot + steam + "RasaRisa" + tagline "makan enak, tanpa ribet"
// From asset_logo/, colors: brown #4a2e15, olive #8a9a5b, tan #d49a5b, steam #bda082
export function Logo({ variant = "dark", className }: LogoProps) {
  const main = variant === "dark" ? "#4a2e15" : "#e8d5c0";
  const sub = variant === "dark" ? "#604a36" : "#b39a82";
  const steam = variant === "dark" ? "#bda082" : "#bda082";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 100"
      className={className}
      role="img"
      aria-label="RasaRisa, makan enak, tanpa ribet"
    >
      <rect width="400" height="100" fill="transparent" />
      <g transform="translate(10, 10) scale(0.6)">
        <path d="M 65 45 Q 55 30 70 15" fill="none" stroke={steam} strokeWidth="4" strokeLinecap="round" />
        <path d="M 85 45 Q 95 30 80 15" fill="none" stroke={steam} strokeWidth="4" strokeLinecap="round" />
        <path d="M 30 85 L 20 85 M 120 85 L 130 85" fill="none" stroke={main} strokeWidth="6" strokeLinecap="round" />
        <path d="M 30 80 L 120 80 L 110 115 Q 75 125 40 115 Z" fill="#8a9a5b" stroke={main} strokeWidth="4" strokeLinejoin="round" />
        <path d="M 25 80 Q 75 50 125 80 Z" fill="#d49a5b" stroke={main} strokeWidth="4" strokeLinejoin="round" />
        <path d="M 68 62 L 82 62 L 80 52 L 70 52 Z" fill={main} />
        <circle cx="75" cy="50" r="6" fill={main} />
      </g>
      <text x="110" y="55" fontFamily="'Fraunces', Georgia, serif" fontSize="42" fontWeight="bold" fill={main}>RasaRisa</text>
      <text x="115" y="80" fontFamily="'Inter', Arial, sans-serif" fontSize="16" fill={sub}>makan enak, tanpa ribet</text>
    </svg>
  );
}
