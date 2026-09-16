"use client";

import { useState } from "react";
import { AdminPagination, AdminPaginationPageSize } from "./AdminPagination";

type Lead = {
  id: string; name: string; whatsapp: string; email: string | null; source: string; status: string; consent: boolean;
  consentAt: string; createdAt: string; updatedAt: string; assessmentAttemptId: string | null; assessmentResult: string | null;
  pdfStatus: string | null; whatsappStatus: string | null; emailStatus: string | null;
};

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean; };

type Summary = { total: number; new: number; withEmail: number; };

function statusClass(value: string | null) {
  if (value === "SENT" || value === "GENERATED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "SKIPPED") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminBusinessLeadsOperations({ initialLeads, initialPagination, initialSummary }: { initialLeads: Lead[]; initialPagination: Pagination; initialSummary: Summary }) {
  const [leads, setLeads] = useState(initialLeads);
  const [pagination, setPagination] = useState(initialPagination);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPage(page: number, pageSize = pagination.pageSize) {
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/leads?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.code || "ADMIN_LEADS_FAILED");
      setLeads(body.leads || []); setPagination(body.pagination); setSummary(body.summary);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ADMIN_LEADS_FAILED");
    } finally { setLoading(false); }
  }

  return <>
    {message && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{message}</div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {[["Total Leads", summary.total], ["New", summary.new], ["With Email", summary.withEmail]].map(([label, value]) => <div key={label as string} className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
    </div>
    <div className="overflow-x-auto rounded-3xl border bg-white shadow-sm">
      <table className="w-full min-w-[1250px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr>
          <th className="px-5 py-4">Lead</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Source</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Assessment</th><th className="px-5 py-4">Delivery</th><th className="px-5 py-4">Consent</th><th className="px-5 py-4">Updated</th>
        </tr></thead>
        <tbody className="divide-y">
          {leads.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">Belum ada business lead.</td></tr> : leads.map((lead) => <tr key={lead.id} className="align-top hover:bg-slate-50">
            <td className="px-5 py-4"><div className="font-black text-slate-950">{lead.name}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{lead.id}</div></td>
            <td className="px-5 py-4"><div className="font-semibold">{lead.whatsapp}</div><div className="mt-1 text-xs text-slate-500">{lead.email || "Email tidak diberikan"}</div></td>
            <td className="px-5 py-4"><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{lead.source}</span></td>
            <td className="px-5 py-4"><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-700">{lead.status}</span></td>
            <td className="px-5 py-4"><div className="font-black">{lead.assessmentResult || "—"}</div><div className="mt-1 max-w-[190px] truncate font-mono text-[10px] text-slate-400">{lead.assessmentAttemptId || "No attempt"}</div></td>
            <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{[["PDF", lead.pdfStatus], ["WA", lead.whatsappStatus], ["Email", lead.emailStatus]].map(([label, value]) => <span key={label as string} className={`rounded-full border px-2 py-1 text-[10px] font-black ${statusClass(value as string | null)}`}>{label}: {value || "—"}</span>)}</div></td>
            <td className="px-5 py-4"><div className="font-black">{lead.consent ? "YES" : "NO"}</div><div className="mt-1 text-xs text-slate-400">{dateLabel(lead.consentAt)}</div></td>
            <td className="px-5 py-4 text-xs font-semibold text-slate-500">{dateLabel(lead.updatedAt)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="mt-4"><AdminPagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.totalItems} totalPages={pagination.totalPages} hasNextPage={pagination.hasNextPage} hasPreviousPage={pagination.hasPreviousPage} onPageChange={(page) => void loadPage(page)} onPageSizeChange={(pageSize: AdminPaginationPageSize) => void loadPage(1, pageSize)} disabled={loading} /></div>
  </>;
}
