import { ImageResponse } from "next/og";
import { MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand-mark";

const SIZES: Record<string, number> = {
  small: 16,
  medium: 32,
  large: 48,
};

export function generateImageMetadata() {
  return Object.entries(SIZES).map(([id, size]) => ({
    id,
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default function Icon({ id }: { id: string }) {
  const size = SIZES[id] ?? SIZES.medium;

  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox={MARK_VIEWBOX} fill="none">
        {MARK_PATHS.map((path) => (
          <path key={path.fill} d={path.d} fill={path.fill} />
        ))}
      </svg>
    ),
    { width: size, height: size }
  );
}
