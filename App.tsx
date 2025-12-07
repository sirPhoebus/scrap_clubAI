import React, { useState, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { ParseResult, ExtractedLink } from './types';
import { parseChatFile } from './utils/parser';
import { FileUpload } from './components/FileUpload';
import { LinkCard } from './components/LinkCard';
import { Search, X, Link as LinkIcon, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Fuse instance for searching URLs or Authors
  const fuse = useMemo(() => {
    if (!parseResult) return null;
    return new Fuse(parseResult.links, {
      keys: ['url', 'author', 'originalMessage'],
      threshold: 0.3,
    });
  }, [parseResult]);

  // Derived state: Filtered links
  const filteredLinks = useMemo(() => {
    if (!parseResult) return [];
    if (!searchQuery.trim()) return parseResult.links;
    if (!fuse) return parseResult.links;
    
    return fuse.search(searchQuery).map(result => result.item);
  }, [parseResult, searchQuery, fuse]);

  const handleFileLoaded = (content: string, name: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = parseChatFile(content);
      setParseResult(result);
      setFileName(name);
      setIsLoading(false);
    }, 100);
  };

  const resetApp = () => {
    setParseResult(null);
    setFileName("");
    setSearchQuery("");
  };

  if (!parseResult) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400">
           <div className="flex flex-col items-center animate-pulse">
             <RefreshCcw className="animate-spin mb-4" size={48} />
             <p className="text-xl font-medium">Extracting links...</p>
           </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
        <FileUpload onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="w-full px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            
            {/* Logo / File Info */}
            <div className="flex items-center gap-3 min-w-0">
               <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                 <LinkIcon size={20} className="text-white" />
               </div>
               <div className="flex flex-col min-w-0">
                 <h1 className="text-lg font-bold text-slate-100 truncate leading-tight">
                   {fileName}
                 </h1>
                 <p className="text-xs text-slate-400">
                   {filteredLinks.length} links found
                 </p>
               </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl w-full relative group mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search links, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all shadow-inner text-slate-100 placeholder-slate-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Actions */}
            <button 
              onClick={resetApp}
              className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-900"
            >
              <RefreshCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="container mx-auto px-6 py-8">
        {filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-lg">No links found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredLinks.map((link) => (
              <div key={link.id} className="w-full h-full">
                <LinkCard linkItem={link} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Reset Button */}
      <button
        onClick={resetApp}
        className="md:hidden fixed bottom-6 right-6 p-4 bg-slate-800 text-slate-300 rounded-full shadow-2xl border border-slate-700 hover:bg-slate-700 hover:text-white transition-all z-40"
      >
        <RefreshCcw size={20} />
      </button>

    </div>
  );
};

export default App;