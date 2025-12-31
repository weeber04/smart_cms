import { useState, useRef, useEffect } from 'react';
import { Scan, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface ScannerProps {
  onScan: (code: string) => void;
  placeholder?: string;
}

export default function Scanner({ onScan, placeholder = "Scan barcode..." }: ScannerProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on the input field for continuous scanning
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && code) {
      onScan(code);
      setCode(''); // Clear after scan
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
          <Input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 h-12 text-lg font-mono"
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <Button 
          onClick={() => { if(code) { onScan(code); setCode(''); } }}
          className="h-12 px-6"
        >
          <Search className="size-5" />
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Scanner is active. Point scanner at barcode or type manually.
      </p>
    </div>
  );
}