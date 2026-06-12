"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
};

type Team = {
  id: string;
  name: string;
  members: Member[];
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-amber-50 text-amber-700 border-amber-200",
  member: "bg-blue-50 text-blue-700 border-blue-200",
  viewer: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) setTeam(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const currentMember = team?.members.find(
    (m) => m.user.id === (session?.user as { id?: string })?.id
  );
  const isAdmin = currentMember?.role === "admin";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInviteLoading(true);

    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: invitePassword,
          role: inviteRole,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("member");
      fetchTeam();
    } catch {
      setError("Failed to invite member");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchTeam();
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
    fetchTeam();
  };

  const inputClass =
    "w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-4 py-2.5 text-[13px] text-black focus:outline-none focus:border-[#999] focus:ring-1 focus:ring-[#999] transition-all placeholder-[#bbb]";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-[#aaa]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[14px]">Loading team...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white text-black">
      <div className="max-w-[640px] mx-auto px-8 pt-10 pb-6 animate-fade-in">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[13px] uppercase tracking-[1.5px] text-[#aaa] mb-1">team</p>
            <h1 className="text-[22px] font-bold tracking-[-0.5px]">{team?.name}</h1>
            <p className="text-[14px] text-[#888] mt-1">
              {team?.members.length} member{team?.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-[13px] font-bold text-white rounded-md transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Add member
            </button>
          )}
        </div>

        {showInvite && (
          <div className="mb-6 p-5 bg-[#fafafa] border border-[#e8e8e8] rounded-xl">
            <h3 className="text-[14px] font-bold mb-4">Add team member</h3>
            <form onSubmit={handleInvite} className="space-y-3">
              {error && (
                <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  className={inputClass}
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Name"
                  required
                />
                <input
                  type="email"
                  className={inputClass}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  className={inputClass}
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Initial password"
                  required
                  minLength={6}
                />
                <select
                  className={inputClass}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-black text-white text-[12px] font-bold rounded-md hover:bg-neutral-800 transition-all disabled:opacity-40"
                >
                  {inviteLoading ? "Adding..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 text-[12px] text-[#888] hover:text-black transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-1">
          {team?.members.map((m) => {
            const isCurrentUser = m.user.id === (session?.user as { id?: string })?.id;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#fafafa] transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                  {m.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold truncate">{m.user.name}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-[#aaa] font-medium">you</span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#888] truncate">{m.user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && !isCurrentUser ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="text-[11px] font-medium px-2 py-1 rounded-md border bg-white cursor-pointer focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                        ROLE_BADGE[m.role] ?? ROLE_BADGE.member
                      }`}
                    >
                      {m.role}
                    </span>
                  )}
                  {isAdmin && !isCurrentUser && (
                    <button
                      onClick={() => handleRemove(m.id, m.user.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-[#f0f0f0]">
          <h3 className="text-[12px] font-semibold text-[#aaa] uppercase tracking-[1px] mb-3">Role permissions</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#fafafa] rounded-lg border border-[#f0f0f0]">
              <div className="text-[12px] font-bold mb-1">Admin</div>
              <div className="text-[11px] text-[#888] leading-relaxed">Full access. Manage team, create/edit/delete projects and tasks.</div>
            </div>
            <div className="p-3 bg-[#fafafa] rounded-lg border border-[#f0f0f0]">
              <div className="text-[12px] font-bold mb-1">Member</div>
              <div className="text-[11px] text-[#888] leading-relaxed">Create/edit projects and tasks. Cannot manage team.</div>
            </div>
            <div className="p-3 bg-[#fafafa] rounded-lg border border-[#f0f0f0]">
              <div className="text-[12px] font-bold mb-1">Viewer</div>
              <div className="text-[11px] text-[#888] leading-relaxed">Read-only access to projects and tasks.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
