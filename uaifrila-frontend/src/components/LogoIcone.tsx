import React from 'react';

export const LogoIcone: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
    return (
        <svg viewBox="0 0 1000 1000" className={className} fill="none" xmlns="http://w3.org">
            <rect width="1000" height="1000" rx="220" fill="black" />
            <text x="740" y="160" fill="#FFC700" fontSize="110" fontWeight="900" fontFamily="cursive, sans-serif" letterSpacing="-5">uai</text>
            <path d="M 500 820 C 500 850, 470 850, 440 850 C 410 850, 390 850, 390 820 L 390 490 L 340 490 C 310 490, 310 420, 310 420 C 310 420, 310 350, 340 350 L 390 350 L 390 290 C 390 190, 480 185, 570 185 C 590 185, 605 190, 615 200 C 600 220, 580 250, 560 270 C 520 270, 500 280, 500 320 L 500 350 L 630 350 C 660 350, 660 420, 660 420 C 660 420, 660 490, 630 490 L 500 490 Z" fill="white" />
            <circle cx="610" cy="235" r="60" fill="#E53935" />
        </svg>
    );
};