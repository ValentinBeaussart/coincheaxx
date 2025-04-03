import React, { useEffect, useState, useRef } from "react";
import { Badge } from "../components/Badge";

interface ZoomableBadgeModalProps {
  badge: {
    icon: React.ReactNode;
    label: string;
    description: string;
    className?: string;
    condition: boolean;
  };
  onClose: () => void;
}

export const ZoomableBadgeModal: React.FC<ZoomableBadgeModalProps> = ({ badge, onClose }) => {
  if (!badge.condition) return null;

  const [rotation, setRotation] = useState(0);
  const isDragging = useRef(false);
  const lastTouchX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const rotate = () => {
      setRotation((prev) => prev + 0.6);
      animationRef.current = requestAnimationFrame(rotate);
    };
    animationRef.current = requestAnimationFrame(rotate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handlePointerDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "grabbing";
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    lastTouchX.current = null;
    document.body.style.cursor = "default";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      setRotation((prev) => prev + e.movementX * 0.5);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touchX = e.touches[0].clientX;
      if (lastTouchX.current !== null) {
        const deltaX = touchX - lastTouchX.current;
        setRotation((prev) => prev + deltaX * 0.5);
      }
      lastTouchX.current = touchX;
    }
  };

  const handleTouchEnd = () => {
    lastTouchX.current = null;
  };

  const isFlipped = (rotation % 360 + 360) % 360 >= 90 && (rotation % 360 + 360) % 360 <= 270;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex flex-col items-center justify-center animate-fade-in"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold z-[10000]"
        aria-label="Fermer"
      >
        &times;
      </button>

      <div className="flex flex-col items-center">
        <div
          className="badge-wrapper w-[8rem] h-[12rem]"
          style={{
            transform: `scale(2.2) rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform",
            filter: "none",
            transition: "transform 0.1s linear"
          }}
        >
          <div className="badge" style={{ transformStyle: "preserve-3d" }}>
            <div className="badge-face badge-front" style={{ backfaceVisibility: "hidden" }}>
              <div className={`badge-shape ${badge.className || ""}`}>
                <div className="circle">{badge.icon}</div>
                <div className="ribbon">{badge.label}</div>
              </div>
            </div>
            <div className="badge-face badge-back" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
              <div className={`badge-shape ${badge.className || ""}`}>
                <div className="circle text-[10px] text-center px-2 leading-tight text-black bg-white flex items-center justify-center">
                  {badge.description}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20" />
      </div>
    </div>
  );
};
