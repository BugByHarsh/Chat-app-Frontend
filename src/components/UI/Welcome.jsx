import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

const highlights = [
  { icon: MessageCircle, title: "Conversations, in one place", detail: "Pick a chat and keep the conversation going." },
  { icon: Users, title: "Stay close to your people", detail: "Find someone by username and start a chat." },
  { icon: ShieldCheck, title: "Your space to connect", detail: "A simple, focused place for your messages." },
];

export default function Welcome() {
  return (
    <main className="relative hidden h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-[#0b1020] md:flex">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center px-7 py-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-4xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-300/[0.07] px-3 py-1.5 text-xs font-medium tracking-wide text-indigo-200">
            <Sparkles size={14} />
            A little more connected
          </div>

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-400/20 to-sky-400/10 shadow-xl shadow-indigo-950/30">
            <MessageCircle size={23} strokeWidth={1.7} className="text-indigo-200" />
          </div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-white lg:text-5xl">
            Good conversations
            <span className="block bg-gradient-to-r from-indigo-300 via-blue-200 to-sky-300 bg-clip-text pb-1 text-transparent">
              start with hello.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 lg:text-base">
            Your people, your messages, your space. Choose a conversation from the left, or find someone new to say hello.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {highlights.map(({ icon: Icon, title, detail }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 + index * 0.07 }}
                className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition-colors hover:border-indigo-300/20 hover:bg-white/[0.045] lg:p-4"
              >
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-indigo-200">
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <h2 className="text-xs font-semibold leading-5 text-slate-200 lg:text-sm">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready when you are
          </div>
        </motion.div>
      </div>
    </main>
  );
}
