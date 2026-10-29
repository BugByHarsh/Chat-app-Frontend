import { useSelector } from "react-redux";
import { Reply, SmilePlus, ChevronDown, Copy } from "lucide-react";
import React, { useState } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

function Recv({ msg, onReply, onReact }) {
    const dark = useSelector((state) => state.theme.dark);
    const [reactionOpen, setReactionOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);
    const actionClass = `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`;
    const closePanels = () => { setReactionOpen(false); setMenuOpen(false); };
    const panelClass = `absolute left-0 top-full mt-1 z-30 min-w-40 overflow-hidden rounded-xl border py-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33] text-gray-100" : "border-gray-200 bg-white text-gray-800"}`;
    const menuItemClass = "flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10";

    return (
        <div className="flex justify-start my-1 ml-2">
            <div className="relative max-w-[85%] sm:max-w-[70%] min-w-0 group">
                <div className="relative">
                    <div className={`absolute -top-4 left-2 z-20 items-center gap-0.5 rounded-full border p-0.5 shadow-lg transition-all duration-150 ${dark ? "border-white/10 bg-[#202c33]" : "border-black/5 bg-white"} hidden sm:flex sm:pointer-events-none sm:opacity-0 sm:translate-y-1 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0`}>
                        <button type="button" title="Reply" aria-label="Reply to message" onClick={(e) => { e.stopPropagation(); onReply?.(msg); closePanels(); }} className={actionClass}><Reply size={16}/></button>
                        {!deleted && <button type="button" title="React" aria-label="React to message" onClick={(e) => { e.stopPropagation(); setReactionOpen(v => !v); setMenuOpen(false); }} className={actionClass}><SmilePlus size={16}/></button>}
                        <button type="button" title="Message menu" aria-label="Message menu" onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); setReactionOpen(false); }} className={actionClass}><ChevronDown size={17}/></button>
                    </div>
                    {reactionOpen && !deleted && <div onClick={(e) => e.stopPropagation()} className={`absolute left-0 top-full mt-1 z-30 flex items-center gap-1 rounded-full border p-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>
                        {QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" title={`React ${emoji}`} aria-label={`React ${emoji}`} onClick={() => { onReact?.(msg, emoji); closePanels(); }} className="rounded-full p-1.5 text-base transition-transform hover:scale-125">{emoji}</button>)}
                    </div>}
                    {menuOpen && <div onClick={(e) => e.stopPropagation()} className={panelClass}>
                        <button type="button" className={menuItemClass} onClick={() => { onReply?.(msg); closePanels(); }}><Reply size={15}/>Reply</button>
                        <button type="button" className={menuItemClass} onClick={async () => { try { await navigator.clipboard.writeText(msg.content || ""); } catch {} closePanels(); }}><Copy size={15}/>Copy</button>
                        {!deleted && <button type="button" className={menuItemClass} onClick={() => { setMenuOpen(false); setReactionOpen(true); }}><SmilePlus size={15}/>React</button>}
                    </div>}
                    <div className={`relative px-3 py-2 rounded-2xl rounded-tl-sm ${dark ? "bg-[#202c33]" : "bg-white border border-[#e9edef]"}`}>
                        {msg.replyTo && <div className={`mb-2 rounded-lg border-l-2 border-[#53bdeb] px-2 py-1 text-xs ${dark ? "bg-black/15 text-gray-300" : "bg-[#f0f2f5] text-gray-600"}`}><div className="font-semibold">{msg.replyTo.sender?.name || "Reply"}</div><div className="truncate">{msg.replyTo.deletedAt ? "This message was deleted" : msg.replyTo.content}</div></div>}
                        <div className="flex items-end gap-2">
                            <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap min-w-0 flex-1 m-0 ${deleted ? "italic opacity-70" : ""} ${dark ? "text-[#e9edef]" : "text-[#111b21]"}`}>{deleted ? "This message was deleted" : msg.content}</p>
                            <div className="flex items-center gap-1 flex-shrink-0 self-end">
                                {msg.editedAt && !deleted && <span className="text-[9px] opacity-60">edited</span>}
                                <span className={`text-[10px] whitespace-nowrap ${dark ? "text-[#8696a0]" : "text-[#667781]"}`}>{timeOnly}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {msg.reactions?.length > 0 && <div className="relative z-[2] flex flex-wrap justify-start gap-1 mt-1">{Object.entries(msg.reactions.reduce((acc, r) => ({...acc, [r.emoji]: (acc[r.emoji] || 0) + 1}), {})).map(([emoji, count]) => <button key={emoji} type="button" onClick={(e) => { e.stopPropagation(); onReact?.(msg, emoji); }} className={`rounded-full border px-2 py-0.5 text-xs shadow-sm ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>{emoji} {count}</button>)}</div>}
            </div>
        </div>
    );
}

export default React.memo(Recv);
