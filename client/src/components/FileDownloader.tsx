
import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';

interface FileDownloaderProps {
  fileName: string;
  fileContent: string;
  buttonText?: string;
}

export default function FileDownloader({ fileName, fileContent, buttonText = "Download" }: FileDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      // Create a blob with the file content
      const blob = new Blob([fileContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      <FileText className="w-4 h-4" />
      {isDownloading ? 'Downloading...' : buttonText}
      <Download className="w-4 h-4" />
    </button>
  );
}
