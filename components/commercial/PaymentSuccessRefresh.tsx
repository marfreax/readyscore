"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_REFRESHES = 6;
const INTERVAL_MS = 2500;

export function PaymentSuccessRefresh() {
  const router = useRouter();
  const countRef = useRef(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      countRef.current += 1;
      router.refresh();
      if (countRef.current >= MAX_REFRESHES) {
        window.clearInterval(timer);
        setChecking(false);
      }
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
      <p className="text-sm font-black text-indigo-900">
        {checking ? "Memastikan akses Anda aktif…" : "Status pembayaran sudah diperbarui."}
      </p>
      {checking ? (
        <p className="mt-1 text-sm leading-6 text-indigo-800">
          ReadyScore sedang menyelaraskan pembayaran dengan akses assessment Anda.
        </p>
      ) : (
        <p className="mt-1 text-sm leading-6 text-indigo-800">
          Jika akses belum berubah, gunakan tombol Cek status lagi atau buka Access &amp; Plans.
        </p>
      )}
    </div>
  );
}
