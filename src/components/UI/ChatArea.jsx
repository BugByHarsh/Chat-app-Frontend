import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import axios from "axios";
import dayjs from "dayjs";
import { Trash2, Send, ChevronLeft, Loader2, X, Reply, MoreVertical, Search, Video, UserPlus, Star, Check, Paperclip, Smile } from "lucide-react";

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
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showCallPrompt, setShowCallPrompt] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [weTyping, setWeTyping] = useState(false);
    const [HeTyping, setHeTyping] = useState(false);
    const timer = useRef(null);
    const scrollRef = useRef(null);
    const messageInputRef = useRef(null);

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
    useEffect(() => { try { setIsFavorite(JSON.parse(localStorage.getItem("weConvoFavorites") || "[]").includes(String(data.id))); } catch { setIsFavorite(false); } }, [data.id]);
    function toggleChatFavorite() { let saved = []; try { saved = JSON.parse(localStorage.getItem("weConvoFavorites") || "[]"); } catch {} const next = saved.includes(String(data.id)) ? saved.filter(id => id !== String(data.id)) : [...saved, String(data.id)]; localStorage.setItem("weConvoFavorites", JSON.stringify(next)); setIsFavorite(next.includes(String(data.id))); setShowChatMenu(false); }
    function deleteChatForMe() { let hidden = []; let favorites = []; try { hidden = JSON.parse(localStorage.getItem("weConvoHiddenChats") || "[]"); } catch {} try { favorites = JSON.parse(localStorage.getItem("weConvoFavorites") || "[]"); } catch {} const chatId = String(data.id); if (!hidden.includes(chatId)) localStorage.setItem("weConvoHiddenChats", JSON.stringify([...hidden, chatId])); localStorage.setItem("weConvoFavorites", JSON.stringify(favorites.filter(id => String(id) !== chatId))); setIsFavorite(false); setShowDeleteChatConfirm(false); setShowChatMenu(false); navigateTo("/app"); }

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
                requestAnimationFrame(() => {
                    scrollToBottom();
                    messageInputRef.current?.focus();
                });
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
        requestAnimationFrame(() => messageInputRef.current?.focus());
    }

    function startEdit(message) {
        if (message.deletedAt) return;
        setReplyTo(null);
        setEditingMessage(message);
        setMessageText(message.content || "");
        setSendError("");
        requestAnimationFrame(() => {
            messageInputRef.current?.focus();
            messageInputRef.current?.select();
        });
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
            {/* WhatsApp-style conversation header */}
            <div className={'relative z-20 flex items-center justify-between border-b px-4 py-2.5 ' + (dark ? 'bg-[#202c33] border-white/[0.06]' : 'bg-[#f0f2f5] border-[#e9edef]')}>
                <div className='flex min-w-0 items-center gap-3'>
                    <button type='button' onClick={goBack} aria-label='Back to chats' className={'rounded-full p-1.5 md:hidden ' + (dark ? 'text-gray-300 hover:bg-white/5' : 'text-[#54656f] hover:bg-black/5')}><ChevronLeft size={19}/></button>
                    <button type='button' onClick={() => setShowContactInfo(value => !value)} className='flex min-w-0 items-center gap-3 text-left'>
                        <div className='relative shrink-0'><AvatarText name={data.name}/><span className={'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 ' + (dark ? 'border-[#202c33]' : 'border-[#f0f2f5]') + (isOnline ? ' bg-emerald-500' : ' bg-gray-400')}/></div>
                        <div className='min-w-0'><p className={'m-0 truncate text-sm font-medium ' + (dark ? 'text-white' : 'text-[#111b21]')}>{data.name}</p><p className={'m-0 text-xs ' + (HeTyping ? 'text-emerald-500' : dark ? 'text-gray-400' : 'text-[#667781]')}>{HeTyping ? 'typing…' : isOnline ? 'online' : 'offline'}</p></div>
                    </button>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                    <button type='button' title='Call from the We-Convo desktop app' aria-label='Call from the We-Convo desktop app' onClick={() => setShowCallPrompt(true)} className={'hidden rounded-full p-2 sm:inline-flex ' + (dark ? 'text-gray-300 hover:bg-white/5' : 'text-[#54656f] hover:bg-black/5')}><Video size={19}/></button>
                    <button type='button' title='Search messages (coming soon)' aria-label='Search messages (coming soon)' className={'rounded-full p-2 ' + (dark ? 'text-gray-300 hover:bg-white/5' : 'text-[#54656f] hover:bg-black/5')}><Search size={19}/></button>
                    <button type='button' title='Conversation options' aria-label='Conversation options' onClick={() => setShowChatMenu(value => !value)} className={'rounded-full p-2 ' + (dark ? 'text-gray-300 hover:bg-white/5' : 'text-[#54656f] hover:bg-black/5')}><MoreVertical size={19}/></button>
                </div>
                {showChatMenu && <div className={'absolute right-3 top-12 z-50 w-60 overflow-hidden rounded-xl py-1 shadow-xl ring-1 ' + (dark ? 'bg-[#233138] text-gray-100 ring-white/10' : 'bg-white text-[#3b4a54] ring-black/10')}>
                    <button type='button' onClick={() => { setShowContactInfo(true); setShowChatMenu(false); }} className='flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/5'><UserPlus size={16}/> Contact info</button>
                    <button type='button' onClick={toggleChatFavorite} className='flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/5'><Star size={16} fill={isFavorite ? 'currentColor' : 'none'}/>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                    <button type='button' onClick={() => { setShowChatMenu(false); navigateTo('/app'); }} className='flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/5'><X size={16}/> Close chat</button>
                    <button type='button' onClick={() => { setShowChatMenu(false); setShowDeleteChatConfirm(true); }} className='flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10'><Trash2 size={16}/> Delete chat</button>
                </div>}
            </div>

            {/* Messages — virtual scroll container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto ${dark ? "bg-[#0b141a]" : "bg-[#efeae2]"}`}
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
            <div className={`border-t px-3 py-2.5 sm:px-4 ${dark ? "bg-[#202c33] border-white/[0.06]" : "bg-[#f0f2f5] border-[#e9edef]"}`}>
                {(replyTo || editingMessage) && <div className={`mb-2 flex items-center justify-between gap-3 rounded-xl border-l-2 border-indigo-400 px-3 py-2 text-xs ${dark ? "bg-white/[0.04] text-gray-300" : "bg-indigo-50 text-gray-700"}`}>
                    <div className="flex min-w-0 items-center gap-2"><Reply size={14} className="flex-shrink-0 text-indigo-400"/><div className="min-w-0"><div className="font-semibold">{editingMessage ? "Editing message" : `Replying to ${replyTo?.sender?.name || "message"}`}</div><div className="truncate">{editingMessage ? editingMessage.content : (replyTo?.deletedAt ? "This message was deleted" : replyTo?.content)}</div></div></div>
                    <button type="button" aria-label="Cancel reply or edit" onClick={() => { setReplyTo(null); setEditingMessage(null); requestAnimationFrame(() => messageInputRef.current?.focus()); }} className="rounded-md p-1 hover:bg-black/10"><X size={14}/></button>
                </div>}
                {sendError && <p role="alert" className="mb-2 text-xs text-red-400">{sendError}</p>}
                <div className="flex items-center gap-3">
                <input
                    ref={messageInputRef}
                    type="text"
                    value={messageText}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    disabled={sending}
                    onChange={handleTyping}
                    placeholder={editingMessage ? "Edit your message…" : "Type a message"}
                    className={`flex-1 rounded-full border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500/15
                        ${dark
                            ? "bg-[#2a3942] border-transparent focus:border-emerald-500 text-white placeholder-gray-400"
                            : "bg-white border-transparent focus:border-emerald-300 text-[#111b21] placeholder-[#667781]"
                        }`}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884] shadow-sm transition-all hover:bg-[#008f72] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {sending ? <Loader2 size={15} className="animate-spin text-white" /> : editingMessage ? <span className="text-xs font-semibold text-white">Save</span> : <Send size={15} className="text-white" />}
                </button>
                </div>
            </div>
            {showDeleteChatConfirm && <div className='absolute inset-0 z-[80] flex items-center justify-center bg-black/45 p-4' onClick={() => setShowDeleteChatConfirm(false)}>
                <section role='dialog' aria-modal='true' aria-labelledby='delete-chat-title' onClick={event => event.stopPropagation()} className={'w-full max-w-sm rounded-2xl p-6 shadow-2xl ' + (dark ? 'bg-[#202c33] text-white' : 'bg-white text-[#111b21]')}>
                    <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-500'><Trash2 size={21}/></div>
                    <h2 id='delete-chat-title' className='text-lg font-semibold'>Delete this chat?</h2>
                    <p className={'mt-2 text-sm leading-6 ' + (dark ? 'text-gray-300' : 'text-[#667781]')}>This removes the conversation from your We-Convo chat list on this device. It does not delete the other person's copy or erase messages from the server.</p>
                    <div className='mt-5 flex justify-end gap-2'><button type='button' onClick={() => setShowDeleteChatConfirm(false)} className={'rounded-full border px-4 py-2.5 text-sm font-medium ' + (dark ? 'border-white/15 hover:bg-white/5' : 'border-[#d1d7db] hover:bg-gray-50')}>Cancel</button><button type='button' onClick={deleteChatForMe} className='rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700'>Delete chat</button></div>
                </section>
            </div>}
            {showCallPrompt && <div className='absolute inset-0 z-[70] flex items-center justify-center bg-black/40 p-4' onClick={() => setShowCallPrompt(false)}>
                <section role='dialog' aria-modal='true' aria-labelledby='call-prompt-title' onClick={event => event.stopPropagation()} className={'w-full max-w-sm rounded-2xl p-6 shadow-2xl ' + (dark ? 'bg-[#202c33] text-white' : 'bg-white text-[#111b21]')}>
                    <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-[#00a884]'><Video size={27}/></div>
                    <h2 id='call-prompt-title' className='text-center text-lg font-semibold'>Call from the We-Convo app</h2>
                    <p className={'mt-2 text-center text-sm leading-6 ' + (dark ? 'text-gray-300' : 'text-[#667781]')}>Voice and video calls on desktop will open in the We-Convo app. Downloadable app support is coming soon.</p>
                    <div className='mt-5 flex gap-2'><button type='button' onClick={() => setShowCallPrompt(false)} className={'flex-1 rounded-full border px-4 py-2.5 text-sm font-medium ' + (dark ? 'border-white/15 hover:bg-white/5' : 'border-[#d1d7db] hover:bg-gray-50')}>Not now</button><button type='button' disabled className='flex-1 cursor-not-allowed rounded-full bg-[#00a884]/50 px-4 py-2.5 text-sm font-semibold text-white' title='App download is not available yet'>Download app</button></div>
                </section>
            </div>}
            {showContactInfo && <aside className={'absolute inset-y-0 right-0 z-40 flex w-full max-w-[340px] flex-col border-l shadow-2xl ' + (dark ? 'border-white/10 bg-[#111b21] text-white' : 'border-[#e9edef] bg-white text-[#111b21]')}>
                <div className={'flex items-center gap-3 border-b px-4 py-4 ' + (dark ? 'border-white/10' : 'border-[#e9edef]')}><button type='button' aria-label='Close contact info' onClick={() => setShowContactInfo(false)} className='rounded-full p-1.5 hover:bg-black/5'><X size={19}/></button><span className='text-base font-medium'>Contact info</span></div>
                <div className='overflow-y-auto px-5 pb-6'>
                    <div className='flex flex-col items-center py-7 text-center'><div className='scale-[1.8]'><AvatarText name={data.name}/></div><h2 className='mt-8 text-xl font-medium'>{data.name}</h2><p className={'mt-1 text-sm ' + (dark ? 'text-gray-400' : 'text-[#667781]')}>{isOnline ? 'online' : 'We-Convo contact'}</p></div>
                    <div className={'my-2 rounded-xl border p-4 ' + (dark ? 'border-white/10' : 'border-[#e9edef]')}><p className={'text-xs ' + (dark ? 'text-gray-400' : 'text-[#667781]')}>About</p><p className='mt-1 text-sm'>Available on We-Convo</p></div>
                    <button type='button' onClick={toggleChatFavorite} className={'flex w-full items-center gap-3 border-b py-4 text-left text-sm ' + (dark ? 'border-white/10' : 'border-[#e9edef]')}><Star size={18} fill={isFavorite ? 'currentColor' : 'none'}/>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                    <div className='py-5'><p className={'text-sm ' + (dark ? 'text-gray-400' : 'text-[#667781]')}>Media, links and docs</p><p className={'mt-2 text-xs ' + (dark ? 'text-gray-500' : 'text-[#8696a0]')}>Shared files and media will appear here when media sharing is available.</p></div>
                    <button type='button' onClick={() => { setShowContactInfo(false); navigateTo('/app'); }} className='flex w-full items-center gap-3 border-t border-red-500/15 py-4 text-left text-sm text-red-500'><X size={17}/> Close chat</button>
                </div>
            </aside>}
        </motion.div>
    );
}