/**
 * EXPORT MY DATA (GDPR data portability)
 * ======================================
 * Triggers Cloud Function exportUserData and downloads result as JSON.
 */

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isFirebaseConfigured } from "@/lib/firebase";
import { exportUserData } from "@/lib/firestore";

interface ExportDataButtonProps {
  userId: string;
}

export default function ExportDataButton({ userId }: ExportDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!isFirebaseConfigured) {
      toast({
        title: "Export unavailable",
        description: "Sign in with your account to export your data.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      const data = await exportUserData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `driiva-data-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full border-white/10 text-white hover:bg-white/10"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? "Preparing export…" : "Export My Data"}
    </Button>
  );
}
