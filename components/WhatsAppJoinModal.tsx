"use client";

import { useEffect, useState } from "react";

type WhatsAppJoinModalProps = {
  jobTitle: string;
};

const DEFAULT_CHANNEL_URL = "https://whatsapp.com/channel";

export default function WhatsAppJoinModal({ jobTitle }: WhatsAppJoinModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const channelUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ?? DEFAULT_CHANNEL_URL;
  const joinHref = `${channelUrl}?text=${encodeURIComponent(
    `Hi, I want job updates like: ${jobTitle}`,
  )}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-[0_35px_80px_-38px_rgba(15,23,42,0.9)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-green-700">WhatsApp Alerts</p>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
          Join Our WhatsApp Channel
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Get new attachments and internship listings instantly. We share fresh openings daily.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <a
            href={joinHref}
            target="_blank"
            rel="noreferrer"
            onClick={closeModal}
            className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-green-950 transition hover:bg-green-400"
          >
            Join Channel
          </a>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
