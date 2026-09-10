"use client";

import { FileDown } from "lucide-react";

export function ExportPdfButton({ targetId }: { targetId: string }) {
  function handleExport() {
    const target = document.getElementById(targetId);
    if (!target) return;
    document.body.classList.add("rs-printing");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove("rs-printing"), 250);
    }, 0);
  }

  return (
    <button type="button" onClick={handleExport} className="rs-button rs-button-primary print-hidden">
      <FileDown className="h-4 w-4" aria-hidden="true" />
      Export PDF
    </button>
  );
}
