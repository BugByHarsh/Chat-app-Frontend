import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

const highlights = [
  { icon: MessageCircle, title: "Conversations, in one place", detail: "Pick a chat and keep the conversation going." },
  { icon: Users, title: "Stay close to your people", detail: "Find someone by username and start a chat." },
  { icon: ShieldCheck, title: "Your space to connect", detail: "A simple, focused place for your messages." },
];

export default function Welcome() {
  return (
    <main className="relative hidden min-w-0 flex-1 overflow-hidden bg-[#0b1020] md:flex">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col justify-center px-8 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-2xl"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-300/[0.07] px-3.5 py-2 text-xs font-medium tracking-wide text-indigo-200">
            <Sparkles size={14} />
            A little more connected
          </div>

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-br from-indigo-400/20 to-sky-400/10 shadow-2xl shadow-indigo-950/40">
            <MessageCircle size={29} strokeWidth={1.7} className="text-indigo-200" />
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-white lg:text-5xl">
            Good conversations
            <span className="block bg-gradient-to-r from-indigo-300 via-blue-200 to-sky-300 bg-clip-text pb-1 text-transparent">
              start with hello.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 lg:text-base">
            Your people, your messages, your space. Choose a conversation from the left, or find someone new to say hello.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, detail }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-indigo-300/20 hover:bg-white/[0.045]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-indigo-200">
                  <Icon size={17} strokeWidth={1.8} />
                </div>
                <h2 className="text-xs font-semibold leading-5 text-slate-200">{title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 text-xs text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready when you are
          </div>
        </motion.div>
      </div>
    </main>
  );
}
