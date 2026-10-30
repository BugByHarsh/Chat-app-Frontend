import { useSelector } from "react-redux";
import { Reply, ChevronDown, Copy } from "lucide-react";
import React, { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function Recv({ msg, onReply, isMenuOpen, onMenuOpenChange }) {
    const dark = useSelector((state) => state.theme.dark);
    const [hovered, setHovered] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, visibility: "hidden" });
    useLayoutEffect(() => {
        if (!isMenuOpen || !menuRef.current || !triggerRef.current) return;
        const placeMenu = () => {
            const anchor = triggerRef.current?.getBoundingClientRect();
            const menu = menuRef.current?.getBoundingClientRect();
            if (!anchor || !menu) return;
            const gap = 8;
            const below = window.innerHeight - anchor.bottom;
            const top = below >= menu.height + gap || anchor.top < menu.height + gap
                ? Math.min(anchor.bottom + gap, window.innerHeight - menu.height - gap)
                : Math.max(gap, anchor.top - menu.height - gap);
            const left = Math.max(gap, Math.min(anchor.left, window.innerWidth - menu.width - gap));
            setMenuPosition({ top, left, visibility: "visible" });
        };
        placeMenu();
        window.addEventListener("resize", placeMenu);
        window.addEventListener("scroll", placeMenu, true);
        return () => {
            window.removeEventListener("resize", placeMenu);
            window.removeEventListener("scroll", placeMenu, true);
        };
    }, [isMenuOpen]);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);
    const panelClass = `fixed z-[1000] min-w-40 overflow-hidden rounded-xl border py-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33] text-gray-100" : "border-gray-200 bg-white text-gray-800"}`;
    const menuItemClass = "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <div className="flex justify-start my-1 ml-10">
            <div className="relative max-w-[85%] sm:max-w-[70%] min-w-0" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                <div className="relative">
                    <button type="button" data-message-menu="true" title="Message menu" aria-label="Message menu" ref={triggerRef} onClick={(e) => { e.stopPropagation(); onMenuOpenChange?.(isMenuOpen ? null : String(msg._id)); }} className={`absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"} ${hovered || isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}><ChevronDown size={16}/></button>
                    {isMenuOpen && createPortal(<div ref={menuRef} data-message-menu="true" onClick={(e) => e.stopPropagation()} style={menuPosition} className={panelClass}>
                        <button type="button" className={menuItemClass} onClick={() => { onReply?.(msg); onMenuOpenChange?.(null); }}><Reply size={15}/>Reply</button>
                        <button type="button" className={menuItemClass} onClick={async () => { try { await navigator.clipboard.writeText(msg.content || ""); } catch {} onMenuOpenChange?.(null); }}><Copy size={15}/>Copy</button>
                    </div>, document.body)}
                    <div className={`relative px-3.5 py-2.5 rounded-2xl rounded-tl-sm ${dark ? "bg-[#202c33]" : "bg-white border border-[#e9edef]"}`}>
                        {msg.replyTo && <div className={`mb-2 rounded-lg border-l-2 border-[#53bdeb] px-2.5 py-1.5 text-[13px] font-medium ${dark ? "bg-black/15 text-gray-300" : "bg-[#f0f2f5] text-gray-600"}`}><div className={`font-bold tracking-[0.01em] ${dark ? "text-[#53bdeb]" : "text-[#087eaa]"}`}>{msg.replyTo.sender?.name || "Reply"}</div><div className="truncate">{msg.replyTo.deletedAt ? "This message was deleted" : msg.replyTo.content}</div></div>}
                        <div className="flex items-end gap-2">
                            <p className={`text-base font-[450] leading-relaxed break-words whitespace-pre-wrap min-w-0 flex-1 m-0 ${deleted ? "italic opacity-70" : ""} ${dark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{deleted ? "This message was deleted" : msg.content}</p>
                            <div className="flex items-center gap-1 flex-shrink-0 self-end">
                                {msg.editedAt && !deleted && <span className="text-[11px] font-medium opacity-75">edited</span>}
                                <span className={`text-xs font-medium whitespace-nowrap ${dark ? "text-[#8696a0]" : "text-[#667781]"}`}>{timeOnly}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(Recv);
