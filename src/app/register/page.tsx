"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, orgName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#fafafa] border border-[#e0e0e0] rounded-lg px-4 py-3 text-[14px] tracking-[-0.3px] text-black focus:outline-none focus:border-[#999] focus:ring-1 focus:ring-[#999] transition-all placeholder-[#bbbbbb]";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] text-black">Create your account</h1>
          <p className="text-[14px] text-[#888] mt-1">Get started with Project Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold tracking-[-0.3px] text-[#888] mb-1.5">Your name</label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold tracking-[-0.3px] text-[#888] mb-1.5">Work email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold tracking-[-0.3px] text-[#888] mb-1.5">Password</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold tracking-[-0.3px] text-[#888] mb-1.5">
              Organization name <span className="text-[#bbb] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-[14px] font-bold rounded-lg transition-all disabled:opacity-40 tracking-[-0.3px]"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#888] mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-black font-semibold hover:underline underline-offset-2">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
