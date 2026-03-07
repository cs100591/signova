import Link from "next/link";
import { SignovaLogo } from "@/components/SignovaLogo";

interface Props {
  searchParams: Promise<{ success?: string; error?: string; token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const isSuccess = params.success === "1";
  const hasToken = Boolean(params.token);

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-[#e0d9ce] rounded-2xl p-10 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <SignovaLogo size={32} textClassName="text-xl text-[#1a1714]" />
        </div>

        {isSuccess ? (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-[#1a1714] mb-3">You&apos;re unsubscribed</h1>
            <p className="text-sm text-[#7a7168] leading-relaxed mb-6">
              You&apos;ve been removed from the Signova onboarding email sequence.
              You will no longer receive introductory emails.
            </p>
            <p className="text-xs text-[#9a8f82]">
              Note: you will still receive important account emails (password reset, workspace invites, contract expiry alerts).
            </p>
          </>
        ) : hasToken ? (
          // Has token but wasn't redirected via API yet — show processing state
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl font-semibold text-[#1a1714] mb-3">Processing…</h1>
            <p className="text-sm text-[#7a7168]">Please wait while we update your preferences.</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">✗</div>
            <h1 className="text-xl font-semibold text-[#1a1714] mb-3">Invalid link</h1>
            <p className="text-sm text-[#7a7168] leading-relaxed mb-6">
              This unsubscribe link is invalid or has expired. Please use the link from your email.
            </p>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-[#e0d9ce]">
          <Link href="/" className="text-sm text-[#c8873a] hover:underline">
            ← Back to Signova
          </Link>
        </div>
      </div>
    </div>
  );
}
