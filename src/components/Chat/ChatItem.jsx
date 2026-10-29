import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import AvatarText from '../miscellaneous/AvatarText';
import { CheckCheck, Star } from 'lucide-react';

const idOf = (value) => value == null ? '' : String(value._id ?? value);

export default function ChatItem({ chat, isFavorite = false, onToggleFavorite }) {
    const navigateTo = useNavigate();
    const dark = useSelector((state) => state.theme.dark);
    const onlineUsers = useSelector((state) => state.online);

    let userData;
    try { userData = JSON.parse(localStorage.getItem("userData")); } catch { userData = null; }

    const currentUserId = idOf(userData?._id);
    const chatUsers = Array.isArray(chat.users) ? chat.users : [];
    const isGroup = chatUsers.length > 2;
    const otherUser = chatUsers.find((user) => idOf(user) !== currentUserId);
    const name = isGroup ? (chat.chatName || chat.name || chatUsers.filter(user => idOf(user) !== currentUserId).map(user => user?.name).filter(Boolean).slice(0, 3).join(", ") || "Group chat") : (otherUser?.name || "Unknown user");
    const recipientId = idOf(otherUser);
    const isOnline = !isGroup && onlineUsers.some((id) => idOf(id) === recipientId);
    const latestMsg = chat.latestMessage;
    const createdAt = latestMsg?.createdAt;
    const parsedTime = createdAt ? new Date(createdAt) : null;
    const validTime = parsedTime && !Number.isNaN(parsedTime.getTime())
        ? parsedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";

    const senderId = idOf(latestMsg?.sender);
    const isUnread = Boolean(latestMsg && senderId && senderId === recipientId && latestMsg.isRead === false);
    const isSentByMe = Boolean(latestMsg && senderId && senderId === currentUserId);

    return (
        <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => navigateTo(`chat/${encodeURIComponent(name)}/${chat._id}/${recipientId}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateTo(`chat/${encodeURIComponent(name)}/${chat._id}/${recipientId}`);
                }
            }}
            className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400
                ${dark ? 'border-[#1a1f2e] hover:bg-white/[0.03]' : 'border-gray-100 hover:bg-gray-50'}`}
        >
            <div className="relative flex-shrink-0">
                <AvatarText name={name} />
                {!isGroup && <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${dark ? 'border-[#151820]' : 'border-white'} ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                    <span className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-medium'} ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {name}
                    </span>
                    <span className={`text-[11px] flex-shrink-0 ml-2 ${isUnread ? 'text-blue-400' : dark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {validTime}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-xs truncate flex items-center gap-1 ${isUnread ? (dark ? 'text-gray-300' : 'text-gray-700') : dark ? 'text-gray-400' : 'text-gray-400'}`}>
                        {latestMsg == null ? 'Tap to chat' : latestMsg.deletedAt ? 'This message was deleted' : latestMsg.content}
                        {isSentByMe && (
                            <CheckCheck size={11} className="flex-shrink-0" color={latestMsg.isRead ? '#60a5fa' : '#6b7280'} />
                        )}
                    </span>
                    {isUnread && <span aria-label="Unread message" className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 ml-2" />}
                </div>
            </div>
            <button type="button" title={isFavorite ? 'Remove from favorites' : 'Add to favorites'} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} onClick={(event) => { event.stopPropagation(); onToggleFavorite?.(); }} className={`rounded-full p-1.5 transition-opacity ${isFavorite ? 'text-amber-500 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'}`}><Star size={14} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        </motion.div>
    );
}
