"use client";

import { useState } from "react";
import { AdminPagination, AdminPaginationPageSize } from "./AdminPagination";

type User = {
  id: string; name: string; email: string; role: "USER" | "ADMIN"; status: "ACTIVE" | "INACTIVE"; createdAt: string;
  counts: { attempts:number; entitlements:number; addOnEntitlements:number; reassessmentCredits:number; institutionMemberships:number; activeEntitlements:number };
};

type Pagination = {
  page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
};

export function AdminUsersOperations({ initialUsers, initialPagination, currentAdminId }: { initialUsers: User[]; initialPagination: Pagination; currentAdminId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [pagination, setPagination] = useState(initialPagination);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPage(page: number, pageSize = pagination.pageSize) {
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.code || "ADMIN_USERS_FAILED");
      setUsers(body.users || []);
      setPagination(body.pagination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ADMIN_USERS_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function mutate(target: User, action: "SET_STATUS" | "SET_ROLE", value: User["status"] | User["role"]) {
    const label = action === "SET_STATUS" ? (value === "ACTIVE" ? "reactivate" : "deactivate") : `change role to ${value}`;
    if (!window.confirm(`${label.toUpperCase()}\n\nUser: ${target.name} (${target.email})\n\nHistorical attempts, answers, results, purchases, entitlements, and institution relationships will not be deleted or rewritten.\n\nContinue?`)) return;
    setBusy(`${target.id}:${action}`); setMessage("");
    try {
      const res = await fetch("/api/admin/users", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ targetUserId:target.id, action, value, confirmed:true }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.code || "USER_OPERATION_FAILED");
      setUsers((current) => current.map((u) => u.id === target.id ? { ...u, role: body.user.role, status: body.user.status } : u));
      setMessage("User access updated and audited.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "USER_OPERATION_FAILED"); }
    finally { setBusy(null); }
  }

  return <>
    {message && <div className="mb-5 rounded-2xl border bg-slate-50 p-4 text-sm font-semibold text-slate-700">{message}</div>}
    <div className="overflow-x-auto rounded-3xl border bg-white shadow-sm">
      <table className="w-full min-w-[1250px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr>
          <th className="px-5 py-4">User</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Active access</th><th className="px-5 py-4">Assessments</th><th className="px-5 py-4">Add-ons</th><th className="px-5 py-4">Reassessment</th><th className="px-5 py-4">Actions</th>
        </tr></thead>
        <tbody className="divide-y">
          {users.map((user) => { const isBusy = busy?.startsWith(user.id); return <tr key={user.id} className="align-top hover:bg-slate-50">
            <td className="px-5 py-4"><div className="font-black">{user.name}</div><div className="mt-1 text-xs text-slate-500">{user.email}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{user.id}</div></td>
            <td className="px-5 py-4"><span className="rounded-full border px-2.5 py-1 text-xs font-black">{user.role}</span></td>
            <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${user.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"}`}>{user.status}</span></td>
            <td className="px-5 py-4 font-black">{user.counts.activeEntitlements}</td><td className="px-5 py-4">{user.counts.attempts}</td><td className="px-5 py-4">{user.counts.addOnEntitlements}</td><td className="px-5 py-4">{user.counts.reassessmentCredits}</td>
            <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
              {user.status === "ACTIVE" ? <button disabled={!!isBusy || user.id === currentAdminId} onClick={() => mutate(user,"SET_STATUS","INACTIVE")} className="rounded-xl border px-3 py-2 text-xs font-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{user.id === currentAdminId ? "Self protected" : "Deactivate"}</button> : <button disabled={!!isBusy} onClick={() => mutate(user,"SET_STATUS","ACTIVE")} className="rounded-xl border px-3 py-2 text-xs font-black hover:bg-slate-100 disabled:opacity-50">Reactivate</button>}
              {user.role === "USER" ? <button disabled={!!isBusy} onClick={() => mutate(user,"SET_ROLE","ADMIN")} className="rounded-xl border px-3 py-2 text-xs font-black hover:bg-slate-100 disabled:opacity-50">Make Admin</button> : <button disabled={!!isBusy || user.id === currentAdminId} onClick={() => mutate(user,"SET_ROLE","USER")} className="rounded-xl border px-3 py-2 text-xs font-black hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">{user.id === currentAdminId ? "Self protected" : "Make User"}</button>}
            </div></td>
          </tr>})}
        </tbody>
      </table>
    </div>
    <div className="mt-4">
      <AdminPagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        hasNextPage={pagination.hasNextPage}
        hasPreviousPage={pagination.hasPreviousPage}
        onPageChange={(page) => void loadPage(page)}
        onPageSizeChange={(pageSize: AdminPaginationPageSize) => void loadPage(1, pageSize)}
        disabled={loading || !!busy}
      />
    </div>
  </>;
}
