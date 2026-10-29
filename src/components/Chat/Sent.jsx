import { useSelector } from "react-redux";
import { CheckCheck, Reply, Pencil, Trash2 } from "lucide-react";
import React from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

function Sent({ msg, onReply, onEdit, onDelete, onReact }) {
    const dark = useSelector((state) => state.theme.dark);
    const time = new Date(msg.createdAt);
    const timeOnly = Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const deleted = Boolean(msg.deletedAt);

    return (
        <div className="flex justify-end my-1 mr-2 group">
            <div className="max-w-[85%] sm:max-w-[70%] min-w-0">
                <div className="flex items-center justify-end gap-1 mb-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button type="button" title="Reply" aria-label="Reply to message" onClick={() => onReply?.(msg)} className={`rounded-md p-1.5 ${dark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-200"}`}><Reply size={13}/></button>
                    {!deleted && <button type="button" title="Edit message" aria-label="Edit message" onClick={() => onEdit?.(msg)} className={`rounded-md p-1.5 ${dark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-200"}`}><Pencil size={13}/></button>}
                    {!deleted && <button type="button" title="Delete message" aria-label="Delete message" onClick={() => onDelete?.(msg)} className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={13}/></button>}
                    {!deleted && QUICK_REACTIONS.map((emoji) => <button key={emoji} type="button" title={`React ${emoji}`} aria-label={`React ${emoji}`} onClick={() => onReact?.(msg, emoji)} className={`rounded-md px-1 py-0.5 text-xs ${dark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}>{emoji}</button>)}
                </div>
                <div className={`px-3 py-2 rounded-2xl rounded-tr-sm ${dark ? "bg-green-800" : "bg-green-200"}`}>
                    {msg.replyTo && <div className={`mb-2 rounded-lg border-l-2 border-indigo-400 px-2 py-1 text-xs ${dark ? "bg-black/15 text-gray-300" : "bg-black/5 text-gray-600"}`}><div className="font-semibold">{msg.replyTo.sender?.name || "Reply"}</div><div className="truncate">{msg.replyTo.deletedAt ? "This message was deleted" : msg.replyTo.content}</div></div>}
                    <div className="flex items-end gap-2">
                        <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap min-w-0 flex-1 m-0 ${deleted ? "italic opacity-70" : ""} ${dark ? "text-white" : "text-black"}`}>{deleted ? "This message was deleted" : msg.content}</p>
                        <div className="flex items-center gap-1 flex-shrink-0 self-end">
                            {msg.editedAt && !deleted && <span className="text-[9px] opacity-60">edited</span>}
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeOnly}</span>
                            <CheckCheck size={11} color={msg.isRead ? "#34B7F1" : dark ? "rgba(255,255,255,0.55)" : "#6b7280"} />
                        </div>
                    </div>
                </div>
                {msg.reactions?.length > 0 && <div className="flex flex-wrap justify-end gap-1 mt-1">{Object.entries(msg.reactions.reduce((acc, r) => ({...acc, [r.emoji]: (acc[r.emoji] || 0) + 1}), {})).map(([emoji, count]) => <button key={emoji} type="button" onClick={() => onReact?.(msg, emoji)} className={`rounded-full border px-2 py-0.5 text-xs ${dark ? "border-white/10 bg-[#161b29]" : "border-gray-200 bg-white"}`}>{emoji} {count}</button>)}</div>}
            </div>
        </div>
    );
}

export default React.memo(Sent);
