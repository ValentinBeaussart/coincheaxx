import React, { useState } from "react";

interface BadgeProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
  description: string;
  disabled?: boolean;
  progress?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  label,
  className = "",
  description,
  disabled = false,
  progress,
}) => {
  const [flipped, setFlipped] = useState(false);

  const disabledStyle = disabled ? "opacity-50 grayscale cursor-not-allowed" : "";

  return (
    <div
      className="badge-wrapper"
      onClick={() => !disabled && setFlipped(!flipped)}
    >
      <div className={`badge ${flipped ? "is-flipped" : ""}`}>
        <div className="badge-face badge-front">
          <div className={`badge-shape ${className} ${disabledStyle}`}>
            <div className="circle">{icon}</div>
            <div className="ribbon">{label}</div>
          </div>
        </div>
        <div className="badge-face badge-back">
          <div className={`badge-shape ${className} ${disabledStyle}`}>
            <div className="circle text-[10px] text-center px-2 leading-tight text-black bg-white">
              {disabled && progress ? progress : description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
