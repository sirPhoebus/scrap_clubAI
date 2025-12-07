import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Calendar, User, Globe } from 'lucide-react';
import { ExtractedLink, LinkMetadata } from '../types';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkItem: ExtractedLink;
  metadata: LinkMetadata;
}

export const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, linkItem, metadata }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Render to document.body to avoid z-index/clipping issues with card transforms
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Image (if exists) */}
        {metadata.image && !metadata.error && (
          <div className="relative w-full aspect-video sm:h-64 bg-black">
             <img 
               src={metadata.image} 
               alt={metadata.title} 
               className="w-full h-full object-contain sm:object-cover opacity-90"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
             >
               <X size={20} />
             </button>
          </div>
        )}

        {/* Header (No Image fallback) */}
        {(!metadata.image || metadata.error) && (
           <div className="flex items-center justify-between p-6 border-b border-slate-800">
             <h2 className="text-xl font-bold text-slate-100 line-clamp-1">Link Summary</h2>
             <button 
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
             >
               <X size={20} />
             </button>
           </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">
              <User size={14} className="text-indigo-400" />
              <span>{linkItem.author}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Calendar size={14} className="text-emerald-400" />
              <span>{linkItem.date.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Globe size={14} className="text-blue-400" />
              <span>{metadata.domain}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-4 leading-tight">
            {metadata.title || linkItem.url}
          </h1>

          <div className="prose prose-invert prose-slate max-w-none">
             {metadata.summary ? (
               <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                 {metadata.summary}
               </p>
             ) : (
               <div className="flex flex-col gap-2 text-slate-500 italic">
                 <p>No summary content could be extracted from this link.</p>
               </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <a 
            href={linkItem.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Visit Website</span>
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
};