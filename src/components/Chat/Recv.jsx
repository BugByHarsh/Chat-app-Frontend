import { useSelector } from "react-redux";
import { Reply, SmilePlus, MoreHorizontal } from "lucide-react";
import React, { useState } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

function Recv({ msg, onReply, onReact }) {
    const dark = useSelector((state) => state.theme.dark);
    const [actionsOpen, setActionsOpen] = useState(false);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);
    const actionClass = `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${dark ? "text-gray-200 hover:bg-white/10" : "text-gray-600 hover:bg-black/5"}`;
    const closeActions = () => setActionsOpen(false);

    return (
        <div className="flex justify-start my-1 ml-2 group">
            <div className="relative max-w-[85%] sm:max-w-[70%] min-w-0">
                <div className="relative">
                    <div className={`absolute -top-4 left-2 z-10 flex items-center gap-0.5 rounded-full border p-0.5 shadow-lg transition-all duration-150 ${dark ? "border-white/10 bg-[#202c33]" : "border-black/5 bg-white"} ${actionsOpen ? "flex" : "hidden sm:flex sm:pointer-events-none sm:opacity-0 sm:translate-y-1 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-hover:translate-y-0 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100 sm:group-focus-within:translate-y-0"}`}>
                        <button type="button" title="Reply" aria-label="Reply to message" onClick={() => { onReply?.(msg); closeActions(); }} className={actionClass}><Reply size={16}/></button>
                        {!deleted && <button type="button" title="React" aria-label="React to message" onClick={() => setActionsOpen((open) => !open)} className={actionClass}><SmilePlus size={16}/></button>}
                        {!deleted && <button type="button" title="More message actions" aria-label="More message actions" onClick={() => setActionsOpen((open) => !open)} className={actionClass}><MoreHorizontal size={17}/></button>}
                    </div>
                    {actionsOpen && <div className={`absolute left-1 -top-14 z-20 flex items-center gap-1 rounded-full border p-1 shadow-xl ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>
                        {!deleted && QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" title={`React ${emoji}`} aria-label={`React ${emoji}`} onClick={() => { onReact?.(msg, emoji); closeActions(); }} className="rounded-full p-1.5 text-base transition-transform hover:scale-125">{emoji}</button>)}
                    </div>}
                    <button type="button" tabIndex={-1} aria-label="Show message actions" onClick={() => setActionsOpen((open) => !open)} className="absolute inset-0 z-0 cursor-default rounded-2xl focus:outline-none"/>
                    <div className={`relative z-[1] pointer-events-none px-3 py-2 rounded-2xl rounded-tl-sm ${dark ? "bg-[#202c33]" : "bg-white border border-[#e9edef]"}`}>
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
                {msg.reactions?.length > 0 && <div className="pointer-events-auto relative z-[2] flex flex-wrap justify-start gap-1 mt-1">{Object.entries(msg.reactions.reduce((acc, r) => ({...acc, [r.emoji]: (acc[r.emoji] || 0) + 1}), {})).map(([emoji, count]) => <button key={emoji} type="button" onClick={() => onReact?.(msg, emoji)} className={`rounded-full border px-2 py-0.5 text-xs shadow-sm ${dark ? "border-white/10 bg-[#202c33]" : "border-gray-200 bg-white"}`}>{emoji} {count}</button>)}</div>}
            </div>
        </div>
    );
}

export default React.memo(Recv);
