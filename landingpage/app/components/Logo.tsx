type LogoProps = {
  width?: number;
  height?: number;
  crossColor?: string;
  waterColor?: string;
  /** Number of ripple lines beneath the mark (1–3). */
  ripples?: 1 | 2 | 3;
  className?: string;
};

/**
 * The Quiet Waters mark — an upright cross above receding "still water"
 * ripples. Colors and ripple count vary by placement, so they're props.
 */
export default function Logo({
  width = 26,
  height = 30,
  crossColor = "#2c4456",
  waterColor = "#9cc0d4",
  ripples = 3,
  className,
}: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 56"
      aria-hidden="true"
      className={className}
    >
      <line
        x1="24"
        y1="6"
        x2="24"
        y2="37"
        stroke={crossColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="16"
        x2="34"
        y2="16"
        stroke={crossColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="44"
        x2="39"
        y2="44"
        stroke={waterColor}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={ripples === 1 ? 0.8 : 1}
      />
      {ripples >= 2 && (
        <line
          x1="15"
          y1="49"
          x2="33"
          y2="49"
          stroke={waterColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.6}
        />
      )}
      {ripples >= 3 && (
        <line
          x1="20"
          y1="53"
          x2="28"
          y2="53"
          stroke={waterColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.35}
        />
      )}
    </svg>
  );
}
