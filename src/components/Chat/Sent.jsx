import { useSelector } from "react-redux";
import { CheckCheck, Reply, Pencil, Trash2, SmilePlus, ChevronDown, Copy } from "lucide-react";
import React, { useState } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

function Sent({ msg, onReply, onEdit, onDelete, onReact }) {
    const dark = useSelector((state) => state.theme.dark);
    const [hovered, setHovered] = useState(false);
    const [reactionOpen, setReactionOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);
    const actionClass = `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`;
    const closePanels = () => { setReactionOpen(false); setMenuOpen(false); };
    const panelClass = `absolute right-0 top-7 z-30 min-w-44 overflow-hidden rounded-xl border py-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33] text-gray-100" : "border-gray-200 bg-white text-gray-800"}`;
    const menuItemClass = "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <div className="flex justify-end my-1 mr-2">
            <div className="relative max-w-[85%] sm:max-w-[70%] min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                <div className="relative">
                    {!deleted && <button type="button" title="React" aria-label="React to message" onClick={(e) => { e.stopPropagation(); setReactionOpen(v => !v); setMenuOpen(false); }} className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-all duration-150 ${dark ? "border-white/10 bg-[#202c33] text-gray-200 hover:bg-white/10" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"} ${hovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}><SmilePlus size={17}/></button>}
                    <button type="button" title="Message menu" aria-label="Message menu" onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); setReactionOpen(false); }} className={`absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"} ${hovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}><ChevronDown size={16}/></button>
                    {reactionOpen && !deleted && <div onClick={(e) => e.stopPropagation()} className={`absolute ${s.side} top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-1 rounded-full border p-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>
                        {QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" title={`React ${emoji}`} aria-label={`React ${emoji}`} onClick={() => { onReact?.(msg, emoji); closePanels(); }} className="rounded-full p-1.5 text-base transition-transform hover:scale-125">{emoji}</button>)}
                    </div>}
                    {menuOpen && <div onClick={(e) => e.stopPropagation()} className={panelClass}>
                        <button type="button" className={menuItemClass} onClick={() => { onReply?.(msg); closePanels(); }}><Reply size={15}/>Reply</button>
                        <button type="button" className={menuItemClass} onClick={async () => { try { await navigator.clipboard.writeText(msg.content || ""); } catch {} closePanels(); }}><Copy size={15}/>Copy</button>
                        {!deleted && <button type="button" className={menuItemClass} onClick={() => { setMenuOpen(false); setReactionOpen(true); }}><SmilePlus size={15}/>React</button>}
                        {!deleted && <button type="button" className={menuItemClass} onClick={() => { onEdit?.(msg); closePanels(); }}><Pencil size={15}/>Edit message</button>}
                        {!deleted && <button type="button" className={`${menuItemClass} text-red-500`} onClick={() => { onDelete?.(msg); closePanels(); }}><Trash2 size={15}/>Delete message</button>}
                    </div>}
                    <div className={`relative px-3 py-2 rounded-2xl rounded-tr-sm ${dark ? "bg-[#005c4b]" : "bg-[#d9fdd3]"}`}>
                        {msg.replyTo && <div className={`mb-2 rounded-lg border-l-2 border-[#53bdeb] px-2 py-1 text-xs ${dark ? "bg-black/15 text-gray-300" : "bg-black/5 text-gray-600"}`}><div className="font-semibold">{msg.replyTo.sender?.name || "Reply"}</div><div className="truncate">{msg.replyTo.deletedAt ? "This message was deleted" : msg.replyTo.content}</div></div>}
                        <div className="flex items-end gap-2">
                            <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap min-w-0 flex-1 m-0 ${deleted ? "italic opacity-70" : ""} ${dark ? "text-white" : "text-[#111b21]"}`}>{deleted ? "This message was deleted" : msg.content}</p>
                            <div className="flex items-center gap-1 flex-shrink-0 self-end">
                                {msg.editedAt && !deleted && <span className="text-[9px] opacity-60">edited</span>}
                                <span className={`text-[10px] whitespace-nowrap ${dark ? "text-white/60" : "text-[#667781]"}`}>{timeOnly}</span>
                                <CheckCheck size={15} color={msg.isRead ? "#53bdeb" : dark ? "rgba(255,255,255,0.6)" : "#8696a0"} />
                            </div>
                        </div>
                    </div>
                </div>
                {msg.reactions?.length > 0 && <div className="relative z-[2] flex flex-wrap justify-end gap-1 mt-1">{Object.entries(msg.reactions.reduce((acc, r) => ({...acc, [r.emoji]: (acc[r.emoji] || 0) + 1}), {})).map(([emoji, count]) => <button key={emoji} type="button" onClick={(e) => { e.stopPropagation(); onReact?.(msg, emoji); }} className={`rounded-full border px-2 py-0.5 text-xs shadow-sm ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>{emoji} {count}</button>)}</div>}
            </div>
        </div>
    );
}

export default React.memo(Sent);
