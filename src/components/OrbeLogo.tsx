import React from 'react';

interface OrbeLogoProps {
  compact?: boolean;
}

export const OrbeLogo: React.FC<OrbeLogoProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2.5 select-none shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          className="stroke-slate-900 dark:stroke-zinc-100"
          strokeWidth="2.2"
        />
        <circle
          cx="16"
          cy="16"
          r="6"
          className="stroke-teal-600 dark:stroke-teal-400"
          strokeWidth="2.2"
        />
        <path
          d="M25.2 6.8C22.8 4.4 19.6 3 16 3"
          className="stroke-teal-600 dark:stroke-teal-400"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100 whitespace-nowrap">
          Orbe
        </span>
      )}
    </div>
  );
};
