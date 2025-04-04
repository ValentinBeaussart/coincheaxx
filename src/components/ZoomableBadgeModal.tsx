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

  const rotationRef = useRef(0);
  const badgeElementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastTouchX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  useEffect(() => {
    const rotate = () => {
      if (!isDragging.current) {
        rotationRef.current += 0.6;
      }
      if (badgeElementRef.current) {
        badgeElementRef.current.style.transform = `scale(2.2) rotateY(${rotationRef.current}deg)`;
      }
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
      rotationRef.current += e.movementX * 0.5;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouchX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && lastTouchX.current !== null) {
      const touchX = e.touches[0].clientX;
      const deltaX = touchX - lastTouchX.current;
      rotationRef.current += deltaX * 0.5;
            lastTouchX.current = touchX;
    }
  };

  const handleTouchEnd = () => {
    lastTouchX.current = null;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
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
          ref={badgeElementRef}
          className="badge-wrapper w-[8rem] h-[12rem]"
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            willChange: "transform",
            filter: "none"
          }}
        >
          <div className="badge" style={{ transformStyle: "preserve-3d" }}>
            <div className="badge-face badge-front" style={{ backfaceVisibility: "hidden" }}>
              <div className={`badge-shape ${badge.className || ""}`}>
                <div className="circle">{badge.icon}</div>
                <div className="ribbon">{badge.label}</div>
              </div>
            </div>
            <div
              className="badge-face badge-back"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
            >
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
