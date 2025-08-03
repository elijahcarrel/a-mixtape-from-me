import React from 'react';
import styles from './CassetteSVG.module.scss';

interface CassetteSVGProps {
  isAnimated?: boolean;
  labelText?: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
  };
  isInteractive?: boolean;
  onLineClick?: (lineIndex: number) => void;
  editingLine?: number | null;
  showCharacterCounts?: boolean;
}

export default function CassetteSVG({ 
  isAnimated, 
  labelText, 
  isInteractive = false, 
  onLineClick, 
  editingLine = null,
  showCharacterCounts = false 
}: CassetteSVGProps) {
  // Helper function to truncate text to fit on cassette label
  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };

  return (
    <svg viewBox="0 0 500 400" width="100%" height="320" className="mx-auto mb-6" aria-label="Cassette tape">
      {/* Outer black body */}
      <rect x="10" y="10" width="480" height="380" rx="15" fill="#232323" stroke="#111" strokeWidth="5" />
      {/* Screws */}
      <circle cx="30" cy="30" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="470" cy="30" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="30" cy="370" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="470" cy="370" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      
      {/* Label area */}
      <rect x="40" y="30" width="420" height="175" rx="5" fill="#e6e6d6" stroke="#bfa76a" strokeWidth="2.5" />
      
      {/* Label lines */}
      <line x1="60" y1="65" x2="440" y2="65" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="95" x2="440" y2="95" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="125" x2="440" y2="125" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="155" x2="440" y2="155" stroke="#bfa76a" strokeWidth="1.5" />
      
      {/* Interactive label text */}
      {labelText && (
        <>
          {/* Clickable backgrounds for interactive mode */}
          {isInteractive && (
            <>
              <rect 
                x="60" y="55" width="380" height="25" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(0)}
                data-testid="line-0"
              />
              <rect 
                x="60" y="85" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(1)}
                data-testid="line-1"
              />
              <rect 
                x="60" y="115" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(2)}
                data-testid="line-2"
              />
              <rect 
                x="60" y="145" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(3)}
                data-testid="line-3"
              />
            </>
          )}
          
          {/* Label text using handwritten font */}
          {labelText.line1 && (
            <text 
              x="250" y="58" 
              textAnchor="middle" 
              fontSize="24" 
              fontWeight="bold" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              style={{ 
                fontVariationSettings: '"wght" 600',
                cursor: isInteractive ? 'pointer' : 'default'
              }}
              className={editingLine === 0 ? 'hidden' : ''}
              data-testid="text-0"
              onClick={isInteractive ? () => onLineClick?.(0) : undefined}
            >
              {truncateText(labelText.line1, 35)}
            </text>
          )}
          {labelText.line2 && (
            <text 
              x="250" y="88" 
              textAnchor="middle" 
              fontSize="16" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 1 ? 'hidden' : ''}
              data-testid="text-1"
              onClick={isInteractive ? () => onLineClick?.(1) : undefined}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              {truncateText(labelText.line2, 40)}
            </text>
          )}
          {labelText.line3 && (
            <text 
              x="250" y="118" 
              textAnchor="middle" 
              fontSize="16" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 2 ? 'hidden' : ''}
              data-testid="text-2"
              onClick={isInteractive ? () => onLineClick?.(2) : undefined}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              {truncateText(labelText.line3, 40)}
            </text>
          )}
          {labelText.line4 && (
            <text 
              x="250" y="148" 
              textAnchor="middle" 
              fontSize="14" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 3 ? 'hidden' : ''}
              data-testid="text-3"
              onClick={isInteractive ? () => onLineClick?.(3) : undefined}
              style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            >
              {truncateText(labelText.line4, 45)}
            </text>
          )}
        </>
      )}
      
      {/* Colored stripes */}
      <rect x="40" y="205" width="420" height="18" fill="#e74c3c" />
      <rect x="40" y="223" width="420" height="18" fill="#f39c12" />
      <rect x="40" y="241" width="420" height="18" fill="#e67e22" />
      
      {/* Spools (animated if isAnimated) */}
      <g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '150px 275px' }}>
          <circle cx="150" cy="275" r="40" fill="#fff" stroke="#bfa76a" strokeWidth="5" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 150 + Math.cos(angle) * 15;
            const y1 = 275 + Math.sin(angle) * 15;
            const x2 = 150 + Math.cos(angle) * 25;
            const y2 = 275 + Math.sin(angle) * 25;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2.5" />;
          })}
          <circle cx="150" cy="275" r="12" fill="#bfa76a" />
        </g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '350px 275px' }}>
          <circle cx="350" cy="275" r="40" fill="#fff" stroke="#bfa76a" strokeWidth="5" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 350 + Math.cos(angle) * 15;
            const y1 = 275 + Math.sin(angle) * 15;
            const x2 = 350 + Math.cos(angle) * 25;
            const y2 = 275 + Math.sin(angle) * 25;
            return <line key={i+8} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2.5" />;
          })}
          <circle cx="350" cy="275" r="12" fill="#bfa76a" />
        </g>
      </g>
      
      {/* Tape between spools */}
      <rect x="190" y="268" width="120" height="14" rx="7" fill="#7c4a03" />
      
      {/* Bottom holes */}
      <rect x="75" y="340" width="30" height="12" rx="3" fill="#bbb" />
      <rect x="395" y="340" width="30" height="12" rx="3" fill="#bbb" />
      <rect x="235" y="340" width="20" height="12" rx="3" fill="#bbb" />
      
      {/* Side A label */}
      <rect x="50" y="45" width="30" height="30" rx="4" fill="#6b3e26" />
      <text x="65" y="67" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" fontFamily="monospace">A</text>
    </svg>
  );
} 