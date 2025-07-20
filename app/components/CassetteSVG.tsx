import React from 'react';
import styles from './CassetteSVG.module.scss';

interface CassetteSVGProps {
  isAnimated?: boolean;
}

export default function CassetteSVG({ isAnimated }: CassetteSVGProps) {
  // Add spinning animation class to spools if isAnimated is true
  return (
    <svg viewBox="0 0 400 220" width="100%" height="180" className="mx-auto mb-6 drop-shadow-lg" aria-label="Cassette tape">
      {/* Outer black body */}
      <rect x="8" y="8" width="384" height="204" rx="12" fill="#232323" stroke="#111" strokeWidth="4" />
      {/* Screws */}
      <circle cx="24" cy="24" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="376" cy="24" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="24" cy="196" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      <circle cx="376" cy="196" r="4" fill="#bbb" stroke="#888" strokeWidth="1.5" />
      {/* Label area */}
      <rect x="32" y="24" width="336" height="60" rx="4" fill="#e6e6d6" stroke="#bfa76a" strokeWidth="2" />
      {/* Label lines */}
      <line x1="48" y1="44" x2="352" y2="44" stroke="#bfa76a" strokeWidth="1" />
      <line x1="48" y1="56" x2="352" y2="56" stroke="#bfa76a" strokeWidth="1" />
      <line x1="48" y1="68" x2="352" y2="68" stroke="#bfa76a" strokeWidth="1" />
      {/* Colored stripes */}
      <rect x="32" y="84" width="336" height="14" fill="#e74c3c" />
      <rect x="32" y="98" width="336" height="14" fill="#f39c12" />
      <rect x="32" y="112" width="336" height="14" fill="#f7d358" />
      {/* Spools (animated if isAnimated) */}
      <g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '120px 140px' }}>
          <circle cx="120" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 120 + Math.cos(angle) * 12;
            const y1 = 140 + Math.sin(angle) * 12;
            const x2 = 120 + Math.cos(angle) * 20;
            const y2 = 140 + Math.sin(angle) * 20;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
          })}
          <circle cx="120" cy="140" r="10" fill="#bfa76a" />
        </g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '280px 140px' }}>
          <circle cx="280" cy="140" r="32" fill="#fff" stroke="#bfa76a" strokeWidth="4" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 280 + Math.cos(angle) * 12;
            const y1 = 140 + Math.sin(angle) * 12;
            const x2 = 280 + Math.cos(angle) * 20;
            const y2 = 140 + Math.sin(angle) * 20;
            return <line key={i+8} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2" />;
          })}
          <circle cx="280" cy="140" r="10" fill="#bfa76a" />
        </g>
      </g>
      {/* Tape between spools */}
      <rect x="152" y="134" width="96" height="12" rx="6" fill="#7c4a03" />
      {/* Bottom holes */}
      <rect x="60" y="192" width="24" height="10" rx="2" fill="#bbb" />
      <rect x="316" y="192" width="24" height="10" rx="2" fill="#bbb" />
      <rect x="192" y="192" width="16" height="10" rx="2" fill="#bbb" />
      {/* Side A label */}
      <rect x="40" y="36" width="24" height="24" rx="3" fill="#6b3e26" />
      <text x="52" y="54" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#fff" fontFamily="monospace">A</text>
    </svg>
  );
} 