import React, { useState } from 'react';
import CassetteSVG from './CassetteSVG';

interface InteractiveCassetteEditorProps {
  title: string;
  subtitle1: string;
  subtitle2: string;
  subtitle3: string;
  onTitleChange: (title: string) => void;
  onSubtitle1Change: (subtitle1: string) => void;
  onSubtitle2Change: (subtitle2: string) => void;
  onSubtitle3Change: (subtitle3: string) => void;
  theme: string;
}

export default function InteractiveCassetteEditor({ 
  title, 
  subtitle1, 
  subtitle2, 
  subtitle3, 
  onTitleChange, 
  onSubtitle1Change, 
  onSubtitle2Change, 
  onSubtitle3Change, 
  theme 
}: InteractiveCassetteEditorProps) {
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const labelText = {
    line1: title,
    line2: subtitle1,
    line3: subtitle2,
    line4: subtitle3
  };

  const getChangeHandler = (lineIndex: number) => {
    switch (lineIndex) {
      case 0: return onTitleChange;
      case 1: return onSubtitle1Change;
      case 2: return onSubtitle2Change;
      case 3: return onSubtitle3Change;
      default: return () => {};
    }
  };

  const getCurrentValue = (lineIndex: number) => {
    switch (lineIndex) {
      case 0: return title;
      case 1: return subtitle1;
      case 2: return subtitle2;
      case 3: return subtitle3;
      default: return '';
    }
  };

  const handleLineEdit = (lineIndex: number, newText: string) => {
    const changeHandler = getChangeHandler(lineIndex);
    changeHandler(newText);
  };

  const handleLineClick = (lineIndex: number) => {
    setEditingLine(lineIndex);
    setEditValue(getCurrentValue(lineIndex));
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
    // All subtitle lines have a 60 character limit
    return 60;
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