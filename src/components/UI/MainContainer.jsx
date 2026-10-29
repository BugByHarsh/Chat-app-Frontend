import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MessageCircle, Users } from "lucide-react";
import SideBar from "./Sidebar";
import AvatarText from "../miscellaneous/AvatarText";

export default function MainContainer() {
  const navigateTo = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("chats");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("userData")) || {}; } catch {}
  useEffect(() => { if (!localStorage.getItem("token")) navigateTo("/"); }, [navigateTo]);
  useEffect(() => {
    if (location.pathname.endsWith("/user/profile")) setActiveSection("profile");
    else if (location.pathname.includes("/chat/")) setActiveSection("chats");
  }, [location.pathname]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex h-[100dvh] w-full overflow-hidden bg-[#f7f8fa]">
      <aside className="relative z-30 hidden h-full w-[68px] shrink-0 flex-col items-center border-r border-slate-200 bg-[#f5f6f8] py-4 md:flex">
        <button type="button" title="We-Convo home" onClick={() => { setActiveSection("chats"); navigateTo("/app"); }} className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm shadow-emerald-900/15"><MessageCircle size={21} strokeWidth={2.2} /></button>
        <nav aria-label="Main navigation" className="flex w-full flex-col items-center gap-3">
          <button type="button" title="Chats" aria-label="Chats" onClick={() => { setActiveSection("chats"); navigateTo("/app"); }} className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeSection === "chats" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}><MessageCircle size={21} />{activeSection === "chats" && <span className="absolute -left-[14px] h-6 w-1 rounded-r-full bg-emerald-500" />}</button>
          <button type="button" title="Groups" aria-label="Groups" onClick={() => { setActiveSection("groups"); navigateTo("/app"); }} className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeSection === "groups" ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}><Users size={21} />{activeSection === "groups" && <span className="absolute -left-[14px] h-6 w-1 rounded-r-full bg-emerald-500" />}</button>
        </nav>
        <div className="mt-auto flex flex-col items-center gap-3">
          <button type="button" title="Profile" aria-label="Profile" onClick={() => { setActiveSection("profile"); navigateTo("/app/user/profile"); }} className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${activeSection === "profile" ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white"}`}><AvatarText name={user.name || "?"} /></button>
          <div className="h-px w-8 bg-slate-200" /><span className="mb-1 text-[10px] font-semibold tracking-widest text-slate-400">WC</span>
        </div>
      </aside>
      <SideBar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden"><Outlet /></div>
    </motion.div>
  );
}