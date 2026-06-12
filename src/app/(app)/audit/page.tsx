"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/helpers";

type Activity = {
  id: string;
  action: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  project: { id: string; name: string };
};

type TeamMember = {
  id: string;
  user: { id: string; name: string };
};

type AuditData = {
  activities: Activity[];
  total: number;
  page: number;
  pages: number;
};

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterUser, setFilterUser] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [filterProject, setFilterProject] = useState("");

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((t) => setMembers(t?.members ?? []))
      .catch(() => {});
    fetch("/api/projects")
      .then((r) => r.json())
      .then((p) => setProjects(Array.isArray(p) ? p.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) : []))
      .catch(() => {});
  }, []);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterUser) params.set("userId", filterUser);
      if (filterProject) params.set("projectId", filterProject);
      const res = await fetch(`/api/audit?${params}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, filterUser, filterProject]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  if (error) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[15px] text-[#888] mb-2">{error}</div>
          <Link href="/" className="text-[13px] text-black underline underline-offset-2">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white text-black">
      <div className="max-w-[800px] mx-auto px-8 pt-10 pb-6 animate-fade-in">
        <div className="mb-8">
          <p className="text-[13px] uppercase tracking-[1.5px] text-[#aaa] mb-1">admin</p>
          <h1 className="text-[22px] font-bold tracking-[-0.5px]">Audit Log</h1>
          <p className="text-[14px] text-[#888] mt-1">
            {data ? `${data.total} total events` : "Loading..."}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <select
            className="bg-[#fafafa] border border-[#e0e0e0] rounded-md px-3 py-2 text-[12px] text-black focus:outline-none focus:border-[#999] transition-colors"
            value={filterUser}
            onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
          >
            <option value="">All users</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
          <select
            className="bg-[#fafafa] border border-[#e0e0e0] rounded-md px-3 py-2 text-[12px] text-black focus:outline-none focus:border-[#999] transition-colors"
            value={filterProject}
            onChange={(e) => { setFilterProject(e.target.value); setPage(1); }}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-[#aaa]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[14px]">Loading...</span>
            </div>
          </div>
        ) : data && data.activities.length > 0 ? (
          <>
            <div className="border border-[#f0f0f0] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                    <th className="text-left text-[10px] font-bold uppercase tracking-[1px] text-[#aaa] px-4 py-2.5">User</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-[1px] text-[#aaa] px-4 py-2.5">Action</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-[1px] text-[#aaa] px-4 py-2.5">Project</th>
                    <th className="text-left text-[10px] font-bold uppercase tracking-[1px] text-[#aaa] px-4 py-2.5">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((a) => (
                    <tr key={a.id} className="border-b border-[#f8f8f8] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {a.user ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                                {a.user.name[0].toUpperCase()}
                              </div>
                              <span className="text-[12px] font-semibold">{a.user.name}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                </svg>
                              </div>
                              <span className="text-[12px] text-[#aaa]">System</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#666]">{a.action}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/project/${a.project.id}`}
                          className="text-[12px] text-black font-semibold hover:underline underline-offset-2"
                        >
                          {a.project.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#aaa] whitespace-nowrap">
                        {formatDateTime(a.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-[12px] bg-[#fafafa] border border-[#e0e0e0] rounded-md disabled:opacity-30 hover:border-[#999] transition-colors"
                >
                  Previous
                </button>
                <span className="text-[12px] text-[#888]">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.pages, page + 1))}
                  disabled={page === data.pages}
                  className="px-3 py-1.5 text-[12px] bg-[#fafafa] border border-[#e0e0e0] rounded-md disabled:opacity-30 hover:border-[#999] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-[14px] text-[#aaa]">No activity recorded yet</div>
        )}
      </div>
    </div>
  );
}
