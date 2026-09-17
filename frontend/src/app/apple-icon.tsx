import { ImageResponse } from "next/og";
import { MARK_PATHS, MARK_VIEWBOX } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#FFFFFF",
        }}
      >
        <svg width="180" height="180" viewBox={MARK_VIEWBOX} fill="none">
          {MARK_PATHS.map((path) => (
            <path key={path.fill} d={path.d} fill={path.fill} />
          ))}
        </svg>
      </div>
    ),
    { ...size }
  );
}
