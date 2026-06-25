import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";

export function QrScannerModal({ open, onClose, onResult }: { open: boolean; onClose: () => void; onResult: (text: string) => void }) {
  const containerId = "qr-reader-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    let stopped = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (stopped) return;
            stopped = true;
            scanner.stop().then(() => scanner.clear()).catch(() => {});
            onResult(decoded);
          },
          () => {},
        );
      } catch (e: any) {
        setError(e?.message || "Không thể truy cập camera. Vui lòng cấp quyền camera.");
      }
    };
    start();

    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [open, onResult]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black text-brand-navy">
            <Camera className="h-5 w-5 text-brand-red" /> Quét mã QR
          </h3>
          <Button onClick={onClose} size="icon" variant="ghost" className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div id={containerId} className="overflow-hidden rounded-2xl bg-black" style={{ minHeight: 280 }} />
        {error ? (
          <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>
        ) : (
          <p className="mt-3 text-center text-xs text-muted-foreground">Đưa mã QR thẻ thành viên vào khung hình</p>
        )}
      </div>
    </div>
  );
}
