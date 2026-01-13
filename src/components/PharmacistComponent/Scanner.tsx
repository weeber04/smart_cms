import React, { useState, useRef } from 'react';
import axios from 'axios';

interface Drug {
  DrugID: number;
  DrugName: string;
  BarcodeID: string;
  QuantityInStock: number;
}

export default function Scanner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  
  // Scanning state
  const [sessionCount, setSessionCount] = useState(0);
  const [feedback, setFeedback] = useState("Ready to Scan...");
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. SEARCH FUNCTION (Fixed with Token & Port 3001)
  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length > 1) {
      try {
        const token = localStorage.getItem('token'); // <--- GET TOKEN
        
        // Correct URL: Port 3001 + /api/pharmacist + Headers
        const res = await axios.get(`http://localhost:3001/api/pharmacist/drugs/search?query=${val}`, {
          headers: { Authorization: `Bearer ${token}` } // <--- SEND TOKEN
        });
        
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search error", err);
      }
    } else {
        setSearchResults([]);
    }
  };

  // 2. SCANNING LOGIC (Fixed with Token & Port 3001)
  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const scannedCode = (e.target as HTMLInputElement).value;
      (e.target as HTMLInputElement).value = ''; // Clear input immediately

      if (selectedDrug && scannedCode === selectedDrug.BarcodeID) {
        try {
          const token = localStorage.getItem('token'); // <--- GET TOKEN

          // Correct URL: Port 3001 + /api/pharmacist + Headers
          await axios.post('http://localhost:3001/api/pharmacist/inventory/increment', 
            { drugId: selectedDrug.DrugID }, 
            { headers: { Authorization: `Bearer ${token}` } } // <--- SEND TOKEN
          );
          
          setSessionCount(prev => prev + 1);
          setFeedback("✅ SUCCESS: Added +1");
        } catch (err) {
          setFeedback("⚠️ SERVER ERROR");
        }
      } else {
        setFeedback("❌ WRONG ITEM! Barcode mismatch.");
      }
    }
  };

  const keepFocus = () => inputRef.current?.focus();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Rapid Restock (Scanner Mode)</h2>

      {!selectedDrug ? (
        <div className="max-w-lg">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Step 1: Search Drug to Restock</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="Type drug name (e.g. Paracetamol)..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          
          <div className="mt-4 border rounded-lg overflow-hidden shadow-sm">
            {searchResults.map(drug => (
              <div 
                key={drug.DrugID}
                onClick={() => setSelectedDrug(drug)}
                className="p-4 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center transition-colors"
              >
                <div>
                    <div className="font-bold text-lg">{drug.DrugName}</div>
                    <div className="text-sm text-gray-500">Barcode: {drug.BarcodeID}</div>
                </div>
                <div className="text-right">
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Stock: {drug.QuantityInStock}</span>
                </div>
              </div>
            ))}
            {searchTerm.length > 1 && searchResults.length === 0 && (
                <div className="p-4 text-gray-500 text-center">No drugs found.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10" onClick={keepFocus}>
          <button 
            onClick={() => { setSelectedDrug(null); setSessionCount(0); setSearchTerm(""); }}
            className="mb-8 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            ← Cancel / Select Different Drug
          </button>

          <h3 className="text-3xl font-bold text-purple-900 mb-2">{selectedDrug.DrugName}</h3>
          <p className="text-gray-400 mb-8 font-mono tracking-wider">Target Barcode: {selectedDrug.BarcodeID}</p>

          <div className="inline-flex items-center justify-center w-48 h-48 rounded-full border-8 border-green-500 bg-green-50 mb-8 shadow-lg transition-transform transform active:scale-95">
            <div>
              <div className="text-6xl font-black text-green-600">{sessionCount}</div>
              <div className="text-xs uppercase font-bold text-green-700 mt-1">Units Added</div>
            </div>
          </div>

          <div className={`text-2xl font-bold p-4 rounded-lg inline-block ${feedback.includes('WRONG') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {feedback}
          </div>

          <p className="mt-6 text-gray-400 text-sm animate-pulse">Scanning active... Scan box now.</p>
          <input ref={inputRef} onKeyDown={handleScan} autoFocus className="opacity-0 absolute top-0 left-0" />
        </div>
      )}
    </div>
  );
}