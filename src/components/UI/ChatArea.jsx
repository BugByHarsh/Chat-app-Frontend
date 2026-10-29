import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "axios";
import dayjs from "dayjs";
import { Trash2, Send, ChevronLeft, Loader2, X, Reply } from "lucide-react";

import Sent from "../Chat/Sent";
import Recv from "../Chat/Recv";
import { socket } from "../../Utils/socket";
import AvatarText from "../miscellaneous/AvatarText";
import { chatActions } from "../../store/ChatSlice";

const idOf = (value) => value == null ? "" : String(value._id ?? value);

function safeGetUser() {
    try { return JSON.parse(localStorage.getItem("userData")); } catch { return null; }
}

// Build a flat list of items: date separators + messages interleaved
function buildItems(msgs) {
    const items = [];
    let lastDate = "";
    // msgs are stored newest-first internally, reverse for display
    const ordered = [...msgs].reverse();
    for (const msg of ordered) {
        const d = dayjs(msg.createdAt);
        const label = d.isValid()
            ? d.isSame(dayjs(), "day") ? "Today"
            : d.isSame(dayjs().subtract(1, "day"), "day") ? "Yesterday"
            : d.format("MMMM D, YYYY")
            : "";
        if (label && label !== lastDate) {
            items.push({ type: "date", label });
            lastDate = label;
        }
        items.push({ type: "msg", msg });
    }
    return items;
}

export default function ChatArea() {
    const dark = useSelector((state) => state.theme.dark);
    const data = useParams();
    const controls = useAnimationControls();
    const dispatch = useDispatch();
    const navigateTo = useNavigate();

    // msgs stored newest-first (prepend older, append newer)
    const [msgs, setMsgs] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [messageText, setMessageText] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [weTyping, setWeTyping] = useState(false);
    const [HeTyping, setHeTyping] = useState(false);
    const timer = useRef(null);
    const scrollRef = useRef(null);

    // Only one message menu may be open. Any click outside its trigger/menu closes it.
    useEffect(() => {
        if (!openMessageMenuId) return;
        const closeOnOutsideClick = (event) => {
            if (!event.target.closest("[data-message-menu='true']")) setOpenMessageMenuId(null);
        };
        document.addEventListener("click", closeOnOutsideClick);
        return () => document.removeEventListener("click", closeOnOutsideClick);
    }, [openMessageMenuId]);

    const onlineUsers = useSelector((state) => state.online);
    const isOnline = onlineUsers.some((id) => String(id?._id ?? id) === String(data.Rid));
    const currentUserId = String(safeGetUser()?._id ?? "");

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchMessages = useCallback(async (chatId, before = null) => {
        const params = before ? `?before=${before}` : "";
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/msg/${chatId}${params}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return response.data; // { messages, hasMore }
    }, []);

    // Initial load when chat changes
    useEffect(() => {
        controls.set("initial");
        controls.start("fadein");
        setMsgs([]);
        setReplyTo(null);
        setEditingMessage(null);
        setOpenMessageMenuId(null);
        setHasMore(false);
        setInitialLoading(true);
        setLoadError("");

        socket.emit("msgsRead", { chatId: data.id });
        dispatch(chatActions.markChatRead({ chatId: data.id, userId: currentUserId }));

        let cancelled = false;
        fetchMessages(data.id).then(({ messages, hasMore }) => {
            if (cancelled) return;
            setMsgs(messages);
            setHasMore(hasMore);
            setInitialLoading(false);
            requestAnimationFrame(() => scrollToBottom());
        }).catch(() => {
            if (cancelled) return;
            setLoadError("Couldn't load this conversation. Check your connection and try again.");
            setInitialLoading(false);
        });
        return () => { cancelled = true; };
    }, [data.id, data.Rid, currentUserId, controls, dispatch, fetchMessages, scrollToBottom]);

    // Load older messages (triggered by scrolling to top)
    async function loadMore() {
        if (loadingMore || !hasMore || msgs.length === 0) return;
        setLoadingMore(true);
        // oldest message is at the end of the array (newest-first)
        const oldest = msgs[msgs.length - 1];
        try {
            const { messages, hasMore: more } = await fetchMessages(data.id, oldest._id);
            // Preserve scroll position: measure current scroll before prepending
            const container = scrollRef.current;
            const prevHeight = container?.scrollHeight ?? 0;

            setMsgs(prev => [...prev, ...messages]); // append older msgs
            setHasMore(more);

            // Restore scroll so user stays at the same visual position
            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - prevHeight;
                }
            });
        } catch (_) {
            // Keep the existing messages and cursor so the user can retry by scrolling up again.
        }
        setLoadingMore(false);
    }

    // ── Socket ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const onTyping = (id) => { if (data.id === id) setHeTyping(true); };
        const onStoppedTyping = (id) => { if (data.id === id) setHeTyping(false); };
        const onNewMessage = (newMsg) => {
            if (idOf(newMsg.chatId) !== idOf(data.id)) return;
            const currentId = String(safeGetUser()?._id ?? "");
            const visibleMessage = idOf(newMsg.sender) !== currentId ? { ...newMsg, isRead: true } : newMsg;
            // Update the inbox from this active-chat listener too. The reducer
            // preserves a read state if duplicate socket listeners run in either order.
            dispatch(chatActions.updateChat(visibleMessage));
            dispatch(chatActions.markChatRead({ chatId: data.id, userId: currentId }));
            socket.emit("msgsRead", { chatId: data.id });
            setHeTyping(false);
            setMsgs(prev => prev.some((message) => idOf(message._id) === idOf(visibleMessage._id)) ? prev : [visibleMessage, ...prev]);
            requestAnimationFrame(() => scrollToBottom());
        };
        const onMessageUpdated = (updated) => {
            if (idOf(updated.chatId) !== idOf(data.id)) return;
            setMsgs(prev => prev.map(message => idOf(message._id) === idOf(updated._id) ? updated : message));
            dispatch(chatActions.updateLatestMessage(updated));
        };
        const onMessageDeleted = (updated) => {
            if (idOf(updated.chatId) !== idOf(data.id)) return;
            setMsgs(prev => prev.map(message => idOf(message._id) === idOf(updated._id) ? updated : message));
            dispatch(chatActions.updateChat(updated));
        };
        const onMessageReactionUpdated = (updated) => {
            if (idOf(updated.chatId) !== idOf(data.id)) return;
            setMsgs(prev => prev.map(message => idOf(message._id) === idOf(updated._id) ? updated : message));
            dispatch(chatActions.updateChat(updated));
        };
        const onMarkRead = (id) => {
            if (idOf(data.id) !== idOf(id)) return;
            const currentId = String(safeGetUser()?._id ?? "");
            dispatch(chatActions.markLatestMessageRead({ chatId: data.id, userId: currentId }));
            setMsgs(prev => prev.map((message) => idOf(message.sender) === currentId ? { ...message, isRead: true } : message));
        };

        socket.on("messageUpdated", onMessageUpdated);
        socket.on("messageDeleted", onMessageDeleted);
        socket.on("messageReactionUpdated", onMessageReactionUpdated);
        socket.on("markRead", onMarkRead);
        socket.on("typing", onTyping);
        socket.on("stoppedTyping", onStoppedTyping);
        socket.on("newMessage", onNewMessage);

        return () => {
            socket.off("messageUpdated", onMessageUpdated);
            socket.off("messageDeleted", onMessageDeleted);
            socket.off("messageReactionUpdated", onMessageReactionUpdated);
            socket.off("typing", onTyping);
            socket.off("stoppedTyping", onStoppedTyping);
            socket.off("markRead", onMarkRead);
            socket.off("newMessage", onNewMessage);
            if (timer.current) clearTimeout(timer.current);
        };
    }, [data.id, data.Rid, dispatch]);

    // ── Send ─────────────────────────────────────────────────────────────────

    async function handleSendMessage() {
        const text = messageText.trim();
        if (!text || sending) return;
        setSending(true);
        setSendError("");
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
            const response = editingMessage
                ? await axios.patch(`${import.meta.env.VITE_API_URL}/msg/${editingMessage._id}`, { content: text }, config)
                : await axios.post(`${import.meta.env.VITE_API_URL}/msg`, { chatID: data.id, content: text, replyTo: replyTo?._id || null }, config);
            if (response.status === 200) {
                const saved = response.data;
                if (editingMessage) setMsgs(prev => prev.map(message => idOf(message._id) === idOf(saved._id) ? saved : message));
                else setMsgs(prev => prev.some(message => idOf(message._id) === idOf(saved._id)) ? prev : [saved, ...prev]);
                dispatch(chatActions.updateChat(saved));
                setMessageText((current) => current.trim() === text ? "" : current);
                setReplyTo(null);
                setEditingMessage(null);
                setSendError("");
                requestAnimationFrame(() => scrollToBottom());
            }
        } catch (error) {
            setSendError(error.response?.data?.message || (editingMessage ? "Couldn't edit the message. Please try again." : "Couldn't send the message. Your text is still here—please try again."));
        } finally {
            setSending(false);
        }
    }

    function startReply(message) {
        setEditingMessage(null);
        setReplyTo(message);
    }

    function startEdit(message) {
        if (message.deletedAt) return;
        setReplyTo(null);
        setEditingMessage(message);
        setMessageText(message.content || "");
        setSendError("");
    }

    async function deleteMessage(message) {
        if (!message?._id || message.deletedAt) return;
        if (!window.confirm("Delete this message for everyone?")) return;
        setSendError("");
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/msg/${message._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setMsgs(prev => prev.map(item => idOf(item._id) === idOf(response.data._id) ? response.data : item));
            dispatch(chatActions.updateLatestMessage(response.data));
            if (idOf(editingMessage?._id) === idOf(message._id)) {
                setEditingMessage(null);
                setMessageText("");
            }
        } catch (error) {
            setSendError(error.response?.data?.message || "Couldn't delete this message. Please try again.");
        }
    }

    async function toggleReaction(message, emoji) {
        if (!message?._id || message.deletedAt) return;
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/msg/${message._id}/reactions`, { emoji }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setMsgs(prev => prev.map(item => idOf(item._id) === idOf(response.data._id) ? response.data : item));
            dispatch(chatActions.updateChat(response.data));
        } catch (error) {
            setSendError(error.response?.data?.message || "Couldn't save that reaction. Please try again.");
        }
    }

    function handleTyping(e) {
        setMessageText(e.target.value);
        if (sendError) setSendError("");
        if (!weTyping) {
            setWeTyping(true);
            socket.emit("isTyping", { chatId: data.id, Rid: data.Rid });
        }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            setWeTyping(false);
            socket.emit("stoppedTyping", { chatId: data.id, Rid: data.Rid });
        }, 1000);
    }

    // ── Virtual scrolling ────────────────────────────────────────────────────

    const items = buildItems(msgs);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        // Estimate height per item — date separators ~32px, messages ~44px
        estimateSize: (i) => items[i]?.type === "date" ? 32 : 44,
        overscan: 10,   // render 10 extra items above/below viewport for smoothness
    });

    // Detect scroll-to-top to trigger loadMore
    function handleScroll(e) {
        if (e.target.scrollTop < 80 && hasMore && !loadingMore) {
            loadMore();
        }
    }

    function goBack() {
        controls.start("fadeOut");
        setTimeout(() => navigateTo(".."), 300);
    }

    return (
        <motion.div
            variants={{ initial: { x: 15, opacity: 0 }, fadein: { x: 0, opacity: 1 }, fadeOut: { x: 15, opacity: 0 } }}
            transition={{ duration: 0.3 }}
            animate={controls}
            className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${dark ? "bg-[#0b141a]" : "bg-gray-50"}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-5 py-4 shadow-sm ${dark ? "bg-[#202c33] border-white/[0.06]" : "bg-[#f0f2f5] border-[#e9edef]"}`}>
                <div className="flex items-center gap-2.5">
                    <button onClick={goBack} className={`md:hidden p-1.5 rounded-lg ${dark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"}`}>
                        <ChevronLeft size={18} />
                    </button>
                    <div className="relative">
                        <AvatarText name={data.name} />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${dark ? "border-[#151820]" : "border-white"} ${isOnline ? "bg-green-400" : "bg-gray-600"}`} />
                    </div>
                    <div>
                        <p className={`text-sm font-semibold m-0 ${dark ? "text-white" : "text-gray-900"}`}>{data.name}</p>
                        {HeTyping
                            ? <p className="text-xs text-blue-400 italic m-0">typing…</p>
                            : <p className={`text-xs m-0 ${isOnline ? "text-green-400" : dark ? "text-gray-600" : "text-gray-400"}`}>{isOnline ? "Online" : "Offline"}</p>
                        }
                    </div>
                </div>
                <button className={`p-2 rounded-lg ${dark ? "text-gray-600 hover:text-gray-400 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Messages — virtual scroll container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto ${dark ? "bg-[#efeae2]" : "bg-[#efeae2]"}`}
            >
                {initialLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 size={20} className={`animate-spin ${dark ? "text-gray-600" : "text-gray-400"}`} />
                    </div>
                ) : (
                    <>
                        {/* Load more spinner at top */}
                        {loadingMore && (
                            <div className="flex justify-center py-3">
                                <Loader2 size={16} className={`animate-spin ${dark ? "text-gray-600" : "text-gray-400"}`} />
                            </div>
                        )}
                        {loadError && (
                            <div role="alert" className="mx-4 my-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
                                {loadError} <button className="ml-1 underline underline-offset-2" onClick={() => { setInitialLoading(true); setLoadError(""); fetchMessages(data.id).then(({ messages, hasMore: more }) => { setMsgs(messages); setHasMore(more); setInitialLoading(false); requestAnimationFrame(() => scrollToBottom()); }).catch(() => { setLoadError("Couldn't load this conversation. Please try again."); setInitialLoading(false); }); }}>Retry</button>
                            </div>
                        )}
                        {!hasMore && msgs.length > 0 && (
                            <p className={`text-center text-xs py-4 ${dark ? "text-gray-700" : "text-gray-400"}`}>
                                Beginning of conversation
                            </p>
                        )}

                        {/* Virtual list */}
                        <div
                            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
                        >
                            {virtualizer.getVirtualItems().map((virtualItem) => {
                                const item = items[virtualItem.index];
                                return (
                                    <div
                                        key={virtualItem.key}
                                        data-index={virtualItem.index}
                                        ref={virtualizer.measureElement}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            transform: `translateY(${virtualItem.start}px)`,
                                            zIndex: item.type === "msg" && openMessageMenuId === idOf(item.msg._id) ? 50 : 1,
                                        }}
                                    >
                                        {item.type === "date" ? (
                                            <div className="flex justify-center py-2">
                                                <span className={`text-[11px] px-3 py-1 rounded-full ${dark ? "bg-[#1e2230] text-gray-500" : "bg-gray-200 text-gray-500"}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ) : idOf(item.msg.sender) === currentUserId ? (
                                            <Sent msg={item.msg} onReply={startReply} onEdit={startEdit} onDelete={deleteMessage} isMenuOpen={openMessageMenuId === idOf(item.msg._id)} onMenuOpenChange={setOpenMessageMenuId} />
                                        ) : (
                                            <Recv msg={item.msg} onReply={startReply} isMenuOpen={openMessageMenuId === idOf(item.msg._id)} onMenuOpenChange={setOpenMessageMenuId} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Input */}
            <div className={`border-t px-4 py-3 sm:px-6 ${dark ? "bg-[#111827] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                {(replyTo || editingMessage) && <div className={`mb-2 flex items-center justify-between gap-3 rounded-xl border-l-2 border-indigo-400 px-3 py-2 text-xs ${dark ? "bg-white/[0.04] text-gray-300" : "bg-indigo-50 text-gray-700"}`}>
                    <div className="flex min-w-0 items-center gap-2"><Reply size={14} className="flex-shrink-0 text-indigo-400"/><div className="min-w-0"><div className="font-semibold">{editingMessage ? "Editing message" : `Replying to ${replyTo?.sender?.name || "message"}`}</div><div className="truncate">{editingMessage ? editingMessage.content : (replyTo?.deletedAt ? "This message was deleted" : replyTo?.content)}</div></div></div>
                    <button type="button" aria-label="Cancel reply or edit" onClick={() => { setReplyTo(null); setEditingMessage(null); }} className="rounded-md p-1 hover:bg-black/10"><X size={14}/></button>
                </div>}
                {sendError && <p role="alert" className="mb-2 text-xs text-red-400">{sendError}</p>}
                <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={messageText}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    disabled={sending}
                    onChange={handleTyping}
                    placeholder={editingMessage ? "Edit your message…" : "Type a message"}
                    className={`flex-1 rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-indigo-400/10
                        ${dark
                            ? "bg-[#090d18] border-white/[0.08] focus:border-indigo-400/60 text-white placeholder-slate-600"
                            : "bg-slate-100 border-transparent focus:border-indigo-300 text-gray-900 placeholder-gray-400"
                        }`}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-950/30 transition-all hover:from-indigo-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {sending ? <Loader2 size={15} className="animate-spin text-white" /> : editingMessage ? <span className="text-xs font-semibold text-white">Save</span> : <Send size={15} className="text-white" />}
                </button>
                </div>
            </div>
        </motion.div>
    );
}