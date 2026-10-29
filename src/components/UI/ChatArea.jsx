import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "axios";
import dayjs from "dayjs";
import { Trash2, Send, ChevronLeft, Loader2 } from "lucide-react";

import Sent from "../Chat/Sent";
import Recv from "../Chat/Recv";
import { socket } from "../../Utils/socket";
import AvatarText from "../miscellaneous/AvatarText";
import { chatActions } from "../../store/ChatSlice";

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
    const [weTyping, setWeTyping] = useState(false);
    const [HeTyping, setHeTyping] = useState(false);
    const timer = useRef(null);

    const onlineUsers = useSelector((state) => state.online);
    const isOnline = onlineUsers.includes(data.Rid);

    function safeGetUser() {
        try { return JSON.parse(localStorage.getItem("userData")); } catch { return null; }
    }

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
        setHasMore(false);
        setInitialLoading(true);

        socket.emit("msgsRead", {
            chatId: data.id, Rid: data.Rid, userId: safeGetUser()?._id
        });
        dispatch(chatActions.updateRead(data.id));

        fetchMessages(data.id).then(({ messages, hasMore }) => {
            setMsgs(messages);        // newest-first from backend
            setHasMore(hasMore);
            setInitialLoading(false);
            // Scroll to bottom after first paint
            setTimeout(() => scrollToBottom(), 50);
        }).catch(() => setInitialLoading(false));
    }, [data.id]);

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
        } catch (_) {}
        setLoadingMore(false);
    }

    // ── Socket ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const onTyping = (id) => { if (data.id === id) setHeTyping(true); };
        const onStoppedTyping = (id) => { if (data.id === id) setHeTyping(false); };
        const onNewMessage = (newMsg) => {
            if (newMsg.chatId !== data.id) return;
            dispatch(chatActions.updateRead(data.id));
            socket.emit("msgsRead", {
                chatId: data.id, Rid: data.Rid, userId: safeGetUser()?._id
            });
            setHeTyping(false);
            setMsgs(prev => [newMsg, ...prev]); // prepend — newest-first
            setTimeout(() => scrollToBottom(), 30);
        };
        const onMarkRead = (id) => {
            dispatch(chatActions.updateRead(data.id));
            if (data.id === id) {
                setMsgs(prev => prev.map(m => ({ ...m, isRead: true })));
            }
        };

        socket.on("markRead", onMarkRead);
        socket.on("typing", onTyping);
        socket.on("stoppedTyping", onStoppedTyping);
        socket.on("newMessage", onNewMessage);

        return () => {
            socket.off("typing", onTyping);
            socket.off("stoppedTyping", onStoppedTyping);
            socket.off("markRead", onMarkRead);
            socket.off("newMessage", onNewMessage);
            if (timer.current) clearTimeout(timer.current);
        };
    }, [data.id, data.Rid, dispatch]);

    // ── Send ─────────────────────────────────────────────────────────────────

    async function handleSendMessage() {
        if (!messageText.trim()) return;
        const text = messageText;
        setMessageText("");
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/msg`,
                { Rid: data.Rid, chatID: data.id, content: text },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            if (response.status === 200) {
                dispatch(chatActions.updateChat(response.data));
                setMsgs(prev => [response.data, ...prev]);
                setTimeout(() => scrollToBottom(), 30);
            }
        } catch (_) {}
    }

    function handleTyping(e) {
        setMessageText(e.target.value);
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
    const scrollRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        // Estimate height per item — date separators ~32px, messages ~44px
        estimateSize: (i) => items[i]?.type === "date" ? 32 : 44,
        overscan: 10,   // render 10 extra items above/below viewport for smoothness
    });

    function scrollToBottom() {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }

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

    const borderClass = dark ? "border-[#1e2230]" : "border-gray-200";

    return (
        <motion.div
            variants={{ initial: { x: 15, opacity: 0 }, fadein: { x: 0, opacity: 1 }, fadeOut: { x: 15, opacity: 0 } }}
            transition={{ duration: 0.3 }}
            animate={controls}
            className={`flex flex-col h-[100dvh] flex-grow sm:absolute sm:top-0 sm:w-full lg:static ${dark ? "bg-[#0d0f14]" : "bg-gray-50"}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-5 py-4 shadow-sm ${dark ? "bg-[#111827] border-white/[0.06]" : "bg-white border-gray-200"}`}>
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
                className={`flex-1 overflow-y-auto ${dark ? "bg-[#0b1020]" : "bg-slate-50"}`}
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
                                        }}
                                    >
                                        {item.type === "date" ? (
                                            <div className="flex justify-center py-2">
                                                <span className={`text-[11px] px-3 py-1 rounded-full ${dark ? "bg-[#1e2230] text-gray-500" : "bg-gray-200 text-gray-500"}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ) : item.msg.sender.name === data.name ? (
                                            <Recv msg={item.msg} />
                                        ) : (
                                            <Sent msg={item.msg} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Input */}
            <div className={`flex items-center gap-3 border-t px-4 py-4 sm:px-6 ${dark ? "bg-[#111827] border-white/[0.06]" : "bg-white border-gray-200"}`}>
                <input
                    type="text"
                    value={messageText}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    onChange={handleTyping}
                    placeholder="Message…"
                    className={`flex-1 rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-indigo-400/10
                        ${dark
                            ? "bg-[#090d18] border-white/[0.08] focus:border-indigo-400/60 text-white placeholder-slate-600"
                            : "bg-slate-100 border-transparent focus:border-indigo-300 text-gray-900 placeholder-gray-400"
                        }`}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-950/30 transition-all hover:from-indigo-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Send size={15} className="text-white" />
                </button>
            </div>
        </motion.div>
    );
}