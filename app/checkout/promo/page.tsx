import type { Metadata } from "next";
import PromoCheckout from "./PromoCheckout";

export const metadata: Metadata = {
  title: "Checkout Paket Lengkap — ReadyScore",
  description: "Isi nama, WhatsApp, dan email, lalu pilih pembayaran untuk paket lengkap ReadyScore.",
  robots: { index: false, follow: false },
};

export default function PromoCheckoutPage() { return <PromoCheckout />; }
