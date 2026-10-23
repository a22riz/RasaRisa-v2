interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

// Logo RasaRisa. variant="dark": full-color horizontal (background terang).
// variant="light": monochrome cream (background gelap, admin sidebar).
export function Logo({ variant = "dark", className }: LogoProps) {
  const src = variant === "light" ? "/logo-mono-light.svg" : "/logo-horizontal.svg";
  return <img src={src} alt="RasaRisa, Makan Praktis, Enak, Tanpa Ribet!" className={className} />;
}
