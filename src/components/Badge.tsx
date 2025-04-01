import React, { useState } from "react";

interface BadgeProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
  description: string;
  disabled?: boolean;
  progress?: string; // ← ajouté
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

  return (
    <div
      className={`badge-wrapper ${disabled ? "opacity-40 grayscale" : ""}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`badge ${flipped ? "is-flipped" : ""}`}>
        <div className={`badge-face badge-front`}>
          <div className={`badge-shape ${className}`}>
            <div className="circle">{icon}</div>
            <div className="ribbon">
              {label}
            </div>
          </div>
        </div>
        <div className={`badge-face badge-back`}>
          <div className={`badge-shape ${className}`}>
            <div className="circle text-[10px] text-center px-2 leading-tight text-black bg-white">
              {description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
