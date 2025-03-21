import React, { useState } from "react";

interface BadgeProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
  description: string;
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  label,
  className = "",
  description,
}) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`badge-wrapper`} onClick={() => setFlipped(!flipped)}>
      <div className={`badge ${className} ${flipped ? "is-flipped" : ""}`}>
        <div className="badge-content front">
          <div className="circle">{icon}</div>
          <div className="ribbon">{label}</div>
        </div>
        <div className="badge-content back">
          <div className="circle text-[10px] leading-tight px-2 text-center">
            {description}
          </div>
          {/* <div className="ribbon">?</div> */}
        </div>
      </div>
    </div>
  );
};
