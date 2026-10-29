import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, UserPlus, LogOut, Moon, Sun, Search, MessageSquare, X } from 'lucide-react';

import { themeActions } from '../../store/ThemeSlice';
import { chatActions } from '../../store/ChatSlice';
import { socket } from '../../Utils/socket';
import ChatItem from '../Chat/ChatItem';
import AvatarText from '../miscellaneous/AvatarText';

export default function SideBar() {
    const chatData = useSelector(state => state.chat);
    const dark = useSelector(state => state.theme.dark);
    const [searchOpen, setSearchOpen] = useState(false);
    const [name, setName] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [filter, setFilter] = useState('');
    const navigateTo = useNavigate();
    const dispatch = useDispatch();

    // FIX: safe JSON parse
    function safeGetUser() {
        try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; }
    }

    // The socket handshake carries the JWT; the server derives the user ID.
    useEffect(() => {
        if (localStorage.getItem('token') && !socket.connected) socket.connect();

        const setData = (data) => dispatch(chatActions.updateChat(data));
        const onNewChat = (newChat) => dispatch(chatActions.appendChat(newChat));
        socket.on('newChat', onNewChat);
        socket.on('newMessage', setData);

        loadChats();

        return () => {
            socket.off('newChat', onNewChat);
            socket.off('newMessage', setData);
            socket.disconnect();
        };
    }, []);

    async function loadChats() {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/api/getAllChats`, {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (response.status === 200 && Array.isArray(response.data.fullChat)) {
                dispatch(chatActions.createChat(response.data.fullChat));
            }
        } catch (_) {}
    }

    async function handleCreateChat(id) {
        setSearchOpen(false);
        setName('');
        setSearchResult(null);
        setSearchError('');
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/api/getAllChats`,
                { userId: id },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (response.status === 200 && Array.isArray(response.data.fullChat)) {
                dispatch(chatActions.createChat(response.data.fullChat));
            }
        } catch (_) {}
    }

    async function handleSearchUser(e) {
        e.preventDefault();
        setSearchError('');
        setSearchResult(null);
        if (name === safeGetUser()?.username) {
            setSearchError("That's your own username.");
            return;
        }
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/api/getSearchedUser?q=${encodeURIComponent(name.trim())}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (response.status === 200) setSearchResult(response.data);
        } catch (error) {
            setSearchError(error.response?.data?.message || 'User not found.');
        }
    }

    const filteredChats = chatData?.filter(chat => {
        if (!filter) return true;
        const me = safeGetUser();
        const other = chat.users?.find(u => u._id !== me?._id);
        return other?.name?.toLowerCase().includes(filter.toLowerCase());
    });

    const bg = dark ? 'bg-[#151820]' : 'bg-white';
    const border = dark ? 'border-[#1e2230]' : 'border-gray-200';
    const inputBg = dark ? 'bg-[#0d0f14] border-[#2a2d35] text-white placeholder-gray-600' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400';

    return (
        <motion.nav
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative z-20 flex h-[100dvh] w-full flex-col border-r ${bg} ${border} md:w-[320px] lg:w-[360px]`}
        >
            <div className={`flex items-center justify-between border-b px-4 py-4 ${border}`}>
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-300/15 bg-gradient-to-br from-indigo-400/20 to-sky-400/10">
                        <MessageSquare size={15} className="text-blue-400" />
                    </div>
                    <span className={`text-base font-semibold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>We-Convo<span className="text-indigo-400">.</span></span>
                </div>
                <div className="flex items-center gap-0.5">
                    {[
                        { icon: <User size={15} />, title: 'Profile', onClick: () => navigateTo('user/profile') },
                        { icon: <UserPlus size={15} />, title: 'New conversation', onClick: () => setSearchOpen(true) },
                        { icon: dark ? <Sun size={15} /> : <Moon size={15} />, title: 'Toggle theme', onClick: () => dispatch(themeActions.change()) },
                        { icon: <LogOut size={15} />, title: 'Sign out', onClick: () => { socket.disconnect(); localStorage.clear(); navigateTo('/'); } },
                    ].map((btn, i) => (
                        <button key={i} title={btn.title} aria-label={btn.title} onClick={btn.onClick}
                            className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                            {btn.icon}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`border-b px-4 py-3 ${border}`}>
                <div className="relative">
                    <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <input
                        type="text" aria-label="Filter conversations" placeholder="Search conversations" value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-4 focus:ring-indigo-400/10 ${inputBg}`}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredChats?.length === 0 && (
                    <p className={`text-center text-xs mt-8 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>No conversations yet</p>
                )}
                {filteredChats?.map((chat, index) => (
                    <motion.div key={chat._id || index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}>
                        <ChatItem chat={chat} />
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {searchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setSearchOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`w-full max-w-sm rounded-2xl p-5 border ${dark ? 'bg-[#151820] border-[#1e2230]' : 'bg-white border-gray-200'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>New conversation</h3>
                                <button onClick={() => setSearchOpen(false)} aria-label="Close new conversation"
                                    className={`p-1 rounded-lg ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <X size={15} />
                                </button>
                            </div>

                            <form onSubmit={handleSearchUser} className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-600' : 'text-gray-400'}`} />
                                    <input
                                        type="text" placeholder="Username or email…" value={name} autoFocus required
                                        onChange={e => setName(e.target.value)}
                                        className={`w-full text-sm rounded-lg pl-8 pr-3 py-2 border outline-none transition-colors ${inputBg}`}
                                    />
                                </div>
                                <button type="submit"
                                    className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-3 rounded-lg transition-colors">
                                    Search
                                </button>
                            </form>

                            {searchError && <p role="alert" className="text-red-400 text-xs mb-2">{searchError}</p>}

                            {searchResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleCreateChat(searchResult._id)}
                                    role="button" tabIndex={0}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateChat(searchResult._id); }}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${dark ? 'bg-[#0d0f14] border-[#1e2230] hover:border-blue-500/40' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}
                                >
                                    <AvatarText name={searchResult.name} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-900'}`}>{searchResult.name}</p>
                                        <p className="text-xs text-gray-500">@{searchResult.username}</p>
                                    </div>
                                    <span className="text-blue-400 text-xs font-medium">Open →</span>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
