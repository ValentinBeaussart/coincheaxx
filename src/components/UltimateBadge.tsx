import React from "react";
import Master from "../assets/icons/master-chief.gif";

export default function UltimateBadge({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) return null;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-red-500"
        title="Badge Légendaire - Gagné 100 parties, joué 100 parties"
      >
        <img
          src={Master}
          alt="Badge Ultime Démon"
          className="object-cover w-full h-full"
        />
      </div>

      <p className="text-sm text-gray-700 text-center font-medium max-w-xs">
        Gagné en jouant 100 parties et en remportant 100 victoires.
      </p>
    </div>
  );
}
