
import React from 'react';
import { Share2, FileText, Code, MessageSquare } from 'lucide-react';

interface ExportActionsProps {
  onExportPDF: () => void;
  onExportHTML: () => void;
  onExportImage?: () => void;
  onShareWA: () => void;
  title?: string;
  className?: string;
}

export const ExportActions: React.FC<ExportActionsProps> = ({ 
  onExportPDF, 
  onExportHTML, 
  onExportImage,
  onShareWA, 
  title = "Export Data",
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        onClick={onShareWA}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-emerald-900/20"
        title="Share via WhatsApp (PDF)"
      >
        <MessageSquare size={16} />
        <span>Share WA (PDF)</span>
      </button>

      {onExportImage && (
        <button
          onClick={onExportImage}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-indigo-900/20"
          title="Download as HD Image"
        >
          <Share2 size={16} />
          <span>Image (HD)</span>
        </button>
      )}

      <button
        onClick={onExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-red-900/20"
        title="Download as PDF"
      >
        <FileText size={16} />
        <span>PDF</span>
      </button>

      <button
        onClick={onExportHTML}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-blue-900/20"
        title="Download as HTML"
      >
        <Code size={16} />
        <span>HTML</span>
      </button>
    </div>
  );
};
