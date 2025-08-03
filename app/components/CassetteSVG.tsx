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
    <svg viewBox="0 0 500 350" width="100%" height="280" className="mx-auto mb-6" aria-label="Cassette tape">
      {/* Outer black body */}
      <rect x="10" y="10" width="480" height="330" rx="15" fill="#232323" stroke="#111" strokeWidth="5" />
      {/* Screws */}
      <circle cx="30" cy="30" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="470" cy="30" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="30" cy="320" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      <circle cx="470" cy="320" r="5" fill="#bbb" stroke="#888" strokeWidth="2" />
      
      {/* Label area */}
      <rect x="40" y="30" width="420" height="125" rx="5" fill="#e6e6d6" stroke="#bfa76a" strokeWidth="2.5" />
      
      {/* Label lines */}
      <line x1="60" y1="55" x2="440" y2="55" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="80" x2="440" y2="80" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="105" x2="440" y2="105" stroke="#bfa76a" strokeWidth="1.5" />
      <line x1="60" y1="130" x2="440" y2="130" stroke="#bfa76a" strokeWidth="1.5" />
      
      {/* Interactive label text */}
      {labelText && (
        <>
          {/* Clickable backgrounds for interactive mode */}
          {isInteractive && (
            <>
              <rect 
                x="60" y="45" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(0)}
                data-testid="line-0"
              />
              <rect 
                x="60" y="70" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(1)}
                data-testid="line-1"
              />
              <rect 
                x="60" y="95" width="380" height="20" 
                fill="transparent" 
                className="cursor-pointer hover:fill-amber-100 hover:fill-opacity-20"
                onClick={() => onLineClick?.(2)}
                data-testid="line-2"
              />
            </>
          )}
          
          {/* Label text using handwritten font */}
          {labelText.line1 && (
            <text 
              x="250" y="48" 
              textAnchor="middle" 
              fontSize="18" 
              fontWeight="bold" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              style={{ fontVariationSettings: '"wght" 600' }}
              className={editingLine === 0 ? 'hidden' : ''}
              data-testid="text-0"
            >
              {truncateText(labelText.line1, 35)}
            </text>
          )}
          {labelText.line2 && (
            <text 
              x="250" y="73" 
              textAnchor="middle" 
              fontSize="16" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 1 ? 'hidden' : ''}
              data-testid="text-1"
            >
              {truncateText(labelText.line2, 40)}
            </text>
          )}
          {labelText.line3 && (
            <text 
              x="250" y="98" 
              textAnchor="middle" 
              fontSize="16" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 2 ? 'hidden' : ''}
              data-testid="text-2"
            >
              {truncateText(labelText.line3, 40)}
            </text>
          )}
          {labelText.line4 && (
            <text 
              x="250" y="123" 
              textAnchor="middle" 
              fontSize="14" 
              fill="#6b3e26" 
              fontFamily="var(--font-caveat), cursive"
              className={editingLine === 3 ? 'hidden' : ''}
              data-testid="text-3"
            >
              {truncateText(labelText.line4, 45)}
            </text>
          )}
          
          {/* Character count indicators */}
          {showCharacterCounts && (
            <>
              {labelText.line1 && (
                <text 
                  x="440" y="48" 
                  textAnchor="end" 
                  fontSize="10" 
                  fill={labelText.line1.length > 35 ? "#e74c3c" : "#6b3e26"}
                  fontFamily="monospace"
                  data-testid="count-0"
                >
                  {labelText.line1.length}/35
                </text>
              )}
              {labelText.line2 && (
                <text 
                  x="440" y="73" 
                  textAnchor="end" 
                  fontSize="10" 
                  fill={labelText.line2.length > 40 ? "#e74c3c" : "#6b3e26"}
                  fontFamily="monospace"
                  data-testid="count-1"
                >
                  {labelText.line2.length}/40
                </text>
              )}
              {labelText.line3 && (
                <text 
                  x="440" y="98" 
                  textAnchor="end" 
                  fontSize="10" 
                  fill={labelText.line3.length > 40 ? "#e74c3c" : "#6b3e26"}
                  fontFamily="monospace"
                  data-testid="count-2"
                >
                  {labelText.line3.length}/40
                </text>
              )}
              {labelText.line4 && (
                <text 
                  x="440" y="123" 
                  textAnchor="end" 
                  fontSize="10" 
                  fill={labelText.line4.length > 45 ? "#e74c3c" : "#6b3e26"}
                  fontFamily="monospace"
                  data-testid="count-3"
                >
                  {labelText.line4.length}/45
                </text>
              )}
            </>
          )}
        </>
      )}
      
      {/* Colored stripes */}
      <rect x="40" y="155" width="420" height="18" fill="#e74c3c" />
      <rect x="40" y="173" width="420" height="18" fill="#f39c12" />
      <rect x="40" y="191" width="420" height="18" fill="#e67e22" />
      
      {/* Spools (animated if isAnimated) */}
      <g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '150px 225px' }}>
          <circle cx="150" cy="225" r="40" fill="#fff" stroke="#bfa76a" strokeWidth="5" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 150 + Math.cos(angle) * 15;
            const y1 = 225 + Math.sin(angle) * 15;
            const x2 = 150 + Math.cos(angle) * 25;
            const y2 = 225 + Math.sin(angle) * 25;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2.5" />;
          })}
          <circle cx="150" cy="225" r="12" fill="#bfa76a" />
        </g>
        <g className={isAnimated ? styles.cassetteSpoolSpin : ''} style={{ transformOrigin: '350px 225px' }}>
          <circle cx="350" cy="225" r="40" fill="#fff" stroke="#bfa76a" strokeWidth="5" />
          {[...Array(8)].map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 350 + Math.cos(angle) * 15;
            const y1 = 225 + Math.sin(angle) * 15;
            const x2 = 350 + Math.cos(angle) * 25;
            const y2 = 225 + Math.sin(angle) * 25;
            return <line key={i+8} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#bfa76a" strokeWidth="2.5" />;
          })}
          <circle cx="350" cy="225" r="12" fill="#bfa76a" />
        </g>
      </g>
      
      {/* Tape between spools */}
      <rect x="190" y="218" width="120" height="14" rx="7" fill="#7c4a03" />
      
      {/* Bottom holes */}
      <rect x="75" y="290" width="30" height="12" rx="3" fill="#bbb" />
      <rect x="395" y="290" width="30" height="12" rx="3" fill="#bbb" />
      <rect x="235" y="290" width="20" height="12" rx="3" fill="#bbb" />
      
      {/* Side A label */}
      <rect x="50" y="45" width="30" height="30" rx="4" fill="#6b3e26" />
      <text x="65" y="67" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#fff" fontFamily="monospace">A</text>
    </svg>
  );
} 