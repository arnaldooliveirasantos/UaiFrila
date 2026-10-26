import React from "react";
export default function LogoIcone({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/icone_uaifrila.png"
      alt="Uai Frila"
      width={size}
      height={size}
      className="object-contain rounded-xl"
      style={{ width: size, height: size }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = new URL(
          "../assets/icone_uaifrila.png",
          import.meta.url,
        ).href;
      }}
    />
  );
}
