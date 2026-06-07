import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Type, Delete, Send } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const KEYBOARD_GRID = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
  ['SPACE', 'DEL', 'CLEAR', 'SEND', '?', '!']
];

export default function EEGSpellerScreen({ isAuthenticated, onRequireAuth }) {
  const [text, setText] = useState('');
  const [activeRow, setActiveRow] = useState(-1);
  const [activeCol, setActiveCol] = useState(-1);
  const [scanningMode, setScanningMode] = useState('row'); // 'row' or 'col'
  const [isSpelling, setIsSpelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      onRequireAuth();
    }
  }, [isAuthenticated, onRequireAuth]);

  // Simulate P300 Speller Row/Col Scanning
  useEffect(() => {
    if (!isSpelling) return;

    let interval;
    if (scanningMode === 'row') {
      interval = setInterval(() => {
        setActiveRow((prev) => (prev + 1) % KEYBOARD_GRID.length);
      }, 1000);
    } else if (scanningMode === 'col') {
      interval = setInterval(() => {
        setActiveCol((prev) => (prev + 1) % KEYBOARD_GRID[0].length);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isSpelling, scanningMode]);

  // Simulated EEG P300 detection (user focuses and signal peaks)
  const handleSimulatedEEGSelection = () => {
    if (!isSpelling) {
      setIsSpelling(true);
      setActiveRow(0);
      setScanningMode('row');
      return;
    }

    if (scanningMode === 'row') {
      setScanningMode('col');
      setActiveCol(0);
    } else {
      // Cell selected
      const char = KEYBOARD_GRID[activeRow][activeCol];
      handleInput(char);
      
      // Reset scan
      setScanningMode('row');
      setActiveCol(-1);
      setActiveRow(0);
    }
  };

  const handleInput = (char) => {
    switch (char) {
      case 'SPACE':
        setText(prev => prev + ' ');
        break;
      case 'DEL':
        setText(prev => prev.slice(0, -1));
        break;
      case 'CLEAR':
        setText('');
        break;
      case 'SEND':
        alert(`Message sent: ${text}`);
        setText('');
        setIsSpelling(false);
        setActiveRow(-1);
        setActiveCol(-1);
        break;
      default:
        setText(prev => prev + char);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-black font-headline text-slate-900 tracking-tight">EEG Text Speller</h1>
          <p className="text-slate-500 mt-2 text-lg">P300 BCI Text Generation</p>
        </div>
        <button 
          onClick={handleSimulatedEEGSelection}
          className={cn(
            "px-6 py-3 rounded-full font-bold shadow-sm transition-colors",
            isSpelling ? "bg-red-100 text-red-700" : "bg-teal-600 text-white hover:bg-teal-700"
          )}
        >
          {isSpelling ? 'Simulate P300 Peak' : 'Start Spelling'}
        </button>
      </header>

      {/* Output Display */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8 min-h-[120px] flex items-center">
        <span className={cn("text-4xl font-headline font-bold", text ? "text-slate-800" : "text-slate-300")}>
          {text || 'Type a message using your brainwaves...'}
        </span>
        <span className="w-1 h-10 bg-teal-500 ml-1 animate-pulse"></span>
      </div>

      {/* Speller Grid */}
      <div className="bg-slate-900 rounded-3xl p-6 shadow-xl flex-1">
        <div className="grid grid-rows-7 gap-2 h-full">
          {KEYBOARD_GRID.map((row, rIndex) => (
            <div key={rIndex} className="grid grid-cols-6 gap-2">
              {row.map((char, cIndex) => {
                const isActive = (scanningMode === 'row' && rIndex === activeRow) || 
                                 (scanningMode === 'col' && rIndex === activeRow && cIndex === activeCol);
                
                return (
                  <div 
                    key={char}
                    className={cn(
                      "flex items-center justify-center rounded-xl text-2xl font-bold transition-colors",
                      isActive ? "bg-teal-400 text-slate-900 scale-105 shadow-lg" : "bg-slate-800 text-slate-300"
                    )}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
