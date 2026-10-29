import { useSelector } from "react-redux";
import { CheckCheck, Reply, Pencil, Trash2, ChevronDown, Copy } from "lucide-react";
import React, { useState } from "react";

function Sent({ msg, onReply, onEdit, onDelete, isMenuOpen, onMenuOpenChange }) {
    const dark = useSelector((state) => state.theme.dark);
    const [hovered, setHovered] = useState(false);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);
    const actionClass = `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`;
    const panelClass = `absolute right-0 top-6 z-[100] min-w-44 overflow-hidden rounded-xl border py-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33] text-gray-100" : "border-gray-200 bg-white text-gray-800"}`;
    const menuItemClass = "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <div className="flex justify-end my-1 mr-2">
            <div className="relative max-w-[85%] sm:max-w-[70%] min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                <div className="relative">
                    <button type="button" data-message-menu="true" title="Message menu" aria-label="Message menu" onClick={(e) => { e.stopPropagation(); onMenuOpenChange?.(isMenuOpen ? null : String(msg._id)); }} className={`absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"} ${hovered || isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}><ChevronDown size={16}/></button>
                    {isMenuOpen && <div data-message-menu="true" onClick={(e) => e.stopPropagation()} className={panelClass}>
                        <button type="button" className={menuItemClass} onClick={() => { onReply?.(msg); onMenuOpenChange?.(null); }}><Reply size={15}/>Reply</button>
                        <button type="button" className={menuItemClass} onClick={async () => { try { await navigator.clipboard.writeText(msg.content || ""); } catch {} onMenuOpenChange?.(null); }}><Copy size={15}/>Copy</button>
                        {!deleted && <button type="button" className={menuItemClass} onClick={() => { onEdit?.(msg); onMenuOpenChange?.(null); }}><Pencil size={15}/>Edit message</button>}
                        {!deleted && <button type="button" className={`${menuItemClass} text-red-500`} onClick={() => { onDelete?.(msg); onMenuOpenChange?.(null); }}><Trash2 size={15}/>Delete message</button>}
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
            </div>
        </div>
    );
}

export default React.memo(Sent);
