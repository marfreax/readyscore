"use client";

import Script from "next/script";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "./promo.module.css";

type Customer = { name: string; phone: string; email: string };
type Order = { orderNumber: string; priceIdr: number; paymentStatus: string; fulfillmentStatus: string; customer: Customer; paymentToken: string | null; redirectUrl: string | null };
type Configuration = { product: { name: string; priceIdr: number; available: boolean }; gateway: { ready: boolean; clientKey: string; scriptUrl: string } };
type Snap = { embed: (token: string, options: { embedId: string; language: string; onSuccess: () => void; onPending: () => void; onError: () => void; onClose: () => void }) => void };
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const terminal = (order: Order) => ["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(order.paymentStatus);

export default function PromoCheckout() {
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "", email: "" });
  const [terms, setTerms] = useState(false);
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessSent, setAccessSent] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/promo/checkout", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error?.message ?? "Checkout belum dapat dimuat. Silakan coba lagi.");
    setConfiguration({ product: data.product, gateway: data.gateway });
    setOrder(data.order);
    if (data.order) { setCustomer(data.order.customer); setTerms(true); }
  }, []);

  useEffect(() => {
    refresh().catch(err => setError(err instanceof Error ? err.message : "Checkout belum tersedia.")).finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!order || terminal(order) || (order.paymentStatus === "PAID" && order.fulfillmentStatus === "FULFILLED")) return;
    // Browser callbacks never grant access. Only the server's verified webhook
    // state is shown, and polling pauses after fifteen minutes.
    let inFlight = false;
    const deadline = Date.now() + 15 * 60_000;
    const timer = window.setInterval(async () => {
      if (document.hidden || inFlight || Date.now() > deadline) return;
      inFlight = true;
      try { await refresh(); } catch { /* Keep the invoice visible during a transient connection error. */ }
      finally { inFlight = false; }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [order?.orderNumber, order?.paymentStatus, order?.fulfillmentStatus, refresh]);

  const paymentToken = order?.paymentToken;
  useEffect(() => {
    if (!scriptReady || !paymentToken) return;
    const snap = (window as Window & { snap?: Snap }).snap;
    if (!snap) { setScriptError(true); return; }
    const verify = () => {
      setNotice("Kami sedang memeriksa status pembayaran. Akses aktif setelah pembayaran terverifikasi.");
      refresh().catch(() => setNotice("Status belum dapat diperbarui. Gunakan tombol Periksa status."));
    };
    try {
      snap.embed(paymentToken, { embedId: "promo-snap-container", language: "id", onSuccess: verify,
        onPending: () => { setNotice("Pesanan menunggu pembayaran. Ikuti instruksi pembayaran di bawah."); void refresh().catch(() => {}); },
        onError: () => { setNotice("Pembayaran belum selesai. Periksa status pesanan sebelum mencoba lagi."); void refresh().catch(() => {}); },
        onClose: () => setNotice("Pilihan pembayaran ditutup. Anda dapat melanjutkan dari pesanan yang sama.") });
    } catch { setScriptError(true); }
  }, [scriptReady, paymentToken, refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/promo/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...customer, acceptedTerms: terms }) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (response.status === 409) await refresh().catch(() => {});
        throw new Error(data.error?.message ?? "Pilihan pembayaran belum dapat ditampilkan.");
      }
      setOrder(data.order); setCustomer(data.order.customer);
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout belum dapat diproses."); }
    finally { setBusy(false); }
  }

  async function checkStatus() {
    setError(""); setBusy(true);
    try { await refresh(); setNotice("Status pesanan sudah diperbarui."); }
    catch (err) { setError(err instanceof Error ? err.message : "Status belum dapat diperbarui."); }
    finally { setBusy(false); }
  }

  async function newOrder() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/promo/checkout", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Pesanan baru belum dapat dibuat.");
      setOrder(null); setTerms(false); setNotice(""); setAccessSent(false);
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Coba lagi nanti."); }
    finally { setBusy(false); }
  }

  async function sendAccess() {
    setAccessBusy(true); setError("");
    try {
      const response = await fetch("/api/promo/access", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error?.message ?? "Link belum dapat dikirim.");
      setAccessSent(true); setNotice(data.message);
    } catch (err) { setError(err instanceof Error ? err.message : "Link belum dapat dikirim."); }
    finally { setAccessBusy(false); }
  }

  const paid = order?.paymentStatus === "PAID";
  const accessReady = paid && order.fulfillmentStatus === "FULFILLED";
  const unavailable = !configuration?.gateway.ready || !configuration?.product.available;

  return (
    <div className={styles.page}>
      {configuration?.gateway.ready && <Script id="promo-midtrans-snap" src={configuration.gateway.scriptUrl} data-client-key={configuration.gateway.clientKey} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setScriptError(true)} />}
      <header className={styles.header}><div><a href="https://promo.readyscore.id/" aria-label="ReadyScore, kembali ke halaman promo"><img src="/readyscore-logo.png" width="166" height="55" alt="ReadyScore" /></a><span>Pembelian paket ReadyScore</span><a href="https://wa.me/6281196962200" target="_blank" rel="noopener noreferrer">Butuh bantuan?</a></div></header>
      <main className={styles.main}>
        <a className={styles.back} href="https://promo.readyscore.id/">← Kembali ke halaman promo</a>
        <div className={styles.heading}><p>SELANGKAH LAGI UNTUK MENGENAL POTENSI ANAK</p><h1>Lengkapi data.<br /><span>Lanjutkan pembayaran.</span></h1><p>Isi data untuk akun dan pesanan Anda. Pilihan pembayaran akan muncul langsung di halaman ini.</p></div>
        <div className={styles.grid}>
          <div className={styles.flow}>
            <form className={styles.card} onSubmit={submit}>
              <h2><span>1</span> Data pemesan</h2><p className={styles.help}>Gunakan email aktif untuk mengelola akses tes dan hasilnya.</p>
              <label htmlFor="promo-name">Nama lengkap</label><input id="promo-name" name="name" autoComplete="name" required minLength={2} maxLength={120} readOnly={Boolean(order)} value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Masukkan nama lengkap" />
              <label htmlFor="promo-phone">Nomor WhatsApp</label><input id="promo-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} readOnly={Boolean(order)} value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="Contoh: 081234567890" /><small>Nomor aktif yang dapat dihubungi terkait pesanan.</small>
              <label htmlFor="promo-email">Email</label><input id="promo-email" name="email" type="email" autoComplete="email" required maxLength={254} readOnly={Boolean(order)} value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="nama@email.com" /><small>Periksa ejaan email. Link pengaturan akses akan dikirim ke alamat ini setelah Anda memintanya.</small>
              {!order && <><label className={styles.consent}><input type="checkbox" required checked={terms} onChange={e => setTerms(e.target.checked)} /><span>Saya menyetujui <a href="/terms" target="_blank" rel="noopener noreferrer">Syarat & Ketentuan</a> dan telah membaca <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a>.</span></label><button className={styles.primary} disabled={busy || loading || unavailable} type="submit">{busy ? "Menyiapkan pembayaran…" : loading ? "Memuat checkout…" : "Pilih Pembayaran — Rp249.000 →"}</button><p className={styles.underButton}>Anda belum dikenakan biaya pada langkah ini.</p></>}
              {order && <p className={styles.locked}>✓ Data pesanan tersimpan. Tidak perlu membuat pesanan ulang.</p>}
            </form>
            <section className={styles.card} aria-labelledby="payment-heading">
              <h2 id="payment-heading"><span>2</span> Pilih pembayaran</h2>
              {!order && <div className={styles.paymentPlaceholder}><div aria-hidden="true">▤</div><h3>Bayar dengan metode pilihan Anda</h3><p>Lengkapi data di atas, kemudian klik Pilih Pembayaran. Metode yang aktif akan ditampilkan oleh Midtrans di sini.</p><span>Transaksi diproses melalui payment gateway.</span></div>}
              {order && <div className={styles.orderReference}><span>Nomor pesanan</span><strong>{order.orderNumber}</strong></div>}
              {order && !paid && !terminal(order) && <><p className={styles.help}>Pilih salah satu metode yang tersedia dan ikuti instruksinya.</p><div id="promo-snap-container" className={styles.snap} />{(!scriptReady || scriptError) && <p className={styles.help}>{scriptError ? "Komponen pembayaran belum dapat dimuat." : "Memuat pilihan pembayaran…"}</p>}{order.redirectUrl && <a className={styles.fallback} href={order.redirectUrl}>Buka halaman pembayaran jika tampilan di atas bermasalah ↗</a>}</>}
              {paid && <div className={styles.success}><span aria-hidden="true">✓</span><h3>Pembayaran terverifikasi</h3><p>{accessReady ? "Akses paket Anda sudah aktif. Masuk ke akun dengan email saat membeli. Untuk akun baru atau jika lupa password, minta link pengaturan password melalui email." : "Kami sedang menyiapkan akses paket Anda. Periksa status beberapa saat lagi. Jika belum aktif, hubungi tim dengan nomor pesanan di atas."}</p>{accessReady && <><a className={styles.primary} href="/login?next=%2Fapp">Masuk ke Akun →</a><button className={styles.secondary} disabled={accessBusy || accessSent} onClick={sendAccess}>{accessBusy ? "Mengirim link…" : accessSent ? "Permintaan link sudah diproses" : "Atur Password Melalui Email"}</button><small>Link ini juga bisa digunakan untuk mengatur ulang password akun yang sudah ada.</small></>}</div>}
              {order && terminal(order) && <div className={styles.paymentPlaceholder}><h3>{order.paymentStatus === "EXPIRED" ? "Pembayaran kedaluwarsa" : order.paymentStatus === "REFUNDED" ? "Pembayaran dikembalikan" : "Pembayaran belum berhasil"}</h3><p>Pesanan ini tidak dapat dilanjutkan. Anda bisa membuat pesanan baru.</p><button className={styles.secondary} onClick={newOrder} disabled={busy}>Buat Pesanan Baru</button></div>}
              {order && <button className={styles.statusButton} disabled={busy} onClick={checkStatus}>{busy ? "Memeriksa…" : "Periksa Status Pembayaran"}</button>}
            </section>
            {error && <div className={styles.error} role="alert">{error}{!order && <button onClick={checkStatus} disabled={busy}>Coba muat ulang checkout</button>}</div>}
            {notice && <div className={styles.notice} role="status">{notice}</div>}
            {!loading && configuration && unavailable && !order && <div className={styles.notice}>Pembayaran online untuk paket ini belum tersedia. <a href="https://wa.me/6281196962200" target="_blank" rel="noopener noreferrer">Hubungi tim ReadyScore</a> untuk bantuan.</div>}
          </div>
          <aside className={styles.summary}>
            <div className={styles.summaryTop}>PAKET LENGKAP READYSCORE</div><h2>Tes & Profiling Lengkap</h2><p>Pahami potensi dan arah pilihan anak melalui assessment dan laporan personal.</p><div className={styles.price}>{rupiah(order?.priceIdr ?? configuration?.product.priceIdr ?? 249000)}<span>Satu kali pembayaran · satu peserta</span></div><ul><li>Akses paket assessment lengkap</li><li>Hasil masing-masing assessment</li><li>Profiling lintas tes</li><li>Laporan personal ReadyScore</li></ul><div className={styles.total}><span>Total pembayaran</span><strong>{rupiah(order?.priceIdr ?? configuration?.product.priceIdr ?? 249000)}</strong></div><p className={styles.summaryNote}>Akses aktif setelah pembayaran terverifikasi. Simpan nomor pesanan Anda.</p><div className={styles.support}><strong>Ada yang ingin ditanyakan?</strong><a href="https://wa.me/6281196962200" target="_blank" rel="noopener noreferrer">Chat tim ReadyScore ↗</a></div>
          </aside>
        </div>
        <footer className={styles.footer}>ReadyScore · Kenali potensi, temukan arah.<span>Data Anda digunakan untuk memproses pesanan dan akses akun.</span></footer>
      </main>
    </div>
  );
}
