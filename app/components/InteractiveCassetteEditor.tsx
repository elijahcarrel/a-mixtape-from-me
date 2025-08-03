import React, { useState } from 'react';
import CassetteSVG from './CassetteSVG';

interface InteractiveCassetteEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: string;
}

export default function InteractiveCassetteEditor({ value, onChange, theme }: InteractiveCassetteEditorProps) {
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Parse the current value into lines
  const lines = value.split('\n');
  const labelText = {
    line1: lines[0] || '', // Title (first line)
    line2: lines[1] || '', // Cassette text line 1
    line3: lines[2] || '', // Cassette text line 2
    line4: lines[3] || ''  // Cassette text line 3
  };

  // Update the title field when the first line changes
  const handleLineEdit = (lineIndex: number, newText: string) => {
    const lines = value.split('\n');
    lines[lineIndex] = newText;
    
    // Convert back to string with newlines
    const newValue = lines.join('\n');
    onChange(newValue);
  };

  const handleLineClick = (lineIndex: number) => {
    setEditingLine(lineIndex);
    const lines = value.split('\n');
    setEditValue(lines[lineIndex] || '');
  };

  const handleEditSave = () => {
    if (editingLine !== null) {
      handleLineEdit(editingLine, editValue);
      setEditingLine(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingLine(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  const getMaxLength = (lineIndex: number) => {
    switch (lineIndex) {
      case 0: return 35;
      case 1: return 40;
      case 2: return 40;
      case 3: return 45;
      default: return 40;
    }
  };

  return (
    <div className="relative">
      {/* Interactive Cassette Preview */}
      <div className="relative w-full max-w-sm mx-auto">
        <CassetteSVG
          isInteractive={true}
          labelText={labelText}
          onLineClick={handleLineClick}
          editingLine={editingLine}
          showCharacterCounts={true}
        />
      </div>

      {/* Inline editor overlay */}
      {editingLine !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className={`bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-lg border-2 ${theme === 'dark' ? 'border-amber-400' : 'border-amber-600'}`}>
            <div className="space-y-3">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-neutral-100' : 'text-neutral-900'}`}>
                Edit Line {editingLine + 1} (max {getMaxLength(editingLine)} characters)
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={getMaxLength(editingLine)}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${theme === 'dark'
                  ? 'bg-neutral-700 border-neutral-600 text-neutral-100 focus:ring-amber-400'
                  : 'bg-white border-neutral-300 text-neutral-900 focus:ring-amber-600'}`}
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleEditCancel}
                  className={`px-3 py-1 text-sm rounded ${theme === 'dark'
                    ? 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className={`px-3 py-1 text-sm rounded ${theme === 'dark'
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-amber-600 text-white hover:bg-amber-500'}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 