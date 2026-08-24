import * as React from "react"

export function LpuLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="30" cy="30" r="26" fill="#F37F20" />
      <path
        d="M12 20L48 20M8 30L52 30M14 40L46 40"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <text
        x="68"
        y="33"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="24"
        fill="#171717"
        letterSpacing="-1"
      >
        LPU
      </text>
      <text
        x="118"
        y="31"
        fontFamily="sans-serif"
        fontWeight="600"
        fontSize="16"
        fill="#525252"
        letterSpacing="-0.5"
      >
        MentorConnect
      </text>
      <rect x="111" y="18" width="1.5" height="15" fill="#E5E5E5" />
    </svg>
  )
}
