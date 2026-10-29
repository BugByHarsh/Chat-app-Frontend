import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

const highlights = [
  { icon: MessageCircle, title: "Conversations, in one place", detail: "Pick a chat and keep the conversation going." },
  { icon: Users, title: "Stay close to your people", detail: "Find someone by username and start a chat." },
  { icon: ShieldCheck, title: "Your space to connect", detail: "A simple, focused place for your messages." },
];

export default function Welcome() {
  const dark = useSelector((state) => state.theme.dark);

  return (
    <main className={`relative hidden h-full min-h-0 min-w-0 flex-1 overflow-hidden md:flex ${dark ? "bg-[#0b1020] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {dark ? (
          <>
            <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </>
        ) : (
          <>
            <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sky-200/35 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "radial-gradient(#94a3b8 0.7px, transparent 0.7px)", backgroundSize: "24px 24px" }} />
          </>
        )}
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center px-7 py-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-4xl"
        >
          <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide ${dark ? "border-indigo-300/15 bg-indigo-300/[0.07] text-indigo-200" : "border-indigo-200 bg-white/80 text-indigo-700 shadow-sm"}`}>
            <Sparkles size={14} />
            A little more connected
          </div>

          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-xl ${dark ? "border-white/10 bg-gradient-to-br from-indigo-400/20 to-sky-400/10 shadow-indigo-950/30" : "border-indigo-100 bg-gradient-to-br from-indigo-100 to-sky-100 shadow-indigo-200/40"}`}>
            <MessageCircle size={23} strokeWidth={1.7} className={dark ? "text-indigo-200" : "text-indigo-600"} />
          </div>

          <h1 className={`text-4xl font-semibold leading-[1.08] tracking-tight lg:text-5xl ${dark ? "text-white" : "text-slate-900"}`}>
            Good conversations
            <span className={`block bg-clip-text pb-1 text-transparent ${dark ? "bg-gradient-to-r from-indigo-300 via-blue-200 to-sky-300" : "bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600"}`}>
              start with hello.
            </span>
          </h1>
          <p className={`mt-3 max-w-xl text-sm leading-6 lg:text-base ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Your people, your messages, your space. Choose a conversation from the left, or find someone new to say hello.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {highlights.map(({ icon: Icon, title, detail }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 + index * 0.07 }}
                className={`min-w-0 rounded-2xl border p-3.5 transition-all hover:-translate-y-0.5 lg:p-4 ${dark ? "border-white/[0.07] bg-white/[0.025] hover:border-indigo-300/20 hover:bg-white/[0.045]" : "border-slate-200/80 bg-white/80 shadow-sm shadow-slate-200/40 hover:border-indigo-200 hover:bg-white hover:shadow-md"}`}
              >
                <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl ${dark ? "bg-white/[0.06] text-indigo-200" : "bg-indigo-50 text-indigo-600"}`}>
                  <Icon size={16} strokeWidth={1.8} />
                </div>
                <h2 className={`text-xs font-semibold leading-5 lg:text-sm ${dark ? "text-slate-200" : "text-slate-800"}`}>{title}</h2>
                <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-500"}`}>{detail}</p>
              </motion.div>
            ))}
          </div>

          <div className={`mt-6 flex items-center gap-2 text-xs ${dark ? "text-slate-600" : "text-slate-500"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready when you are
          </div>
        </motion.div>
      </div>
    </main>
  );
}
