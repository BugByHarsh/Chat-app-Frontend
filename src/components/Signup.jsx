import { useState } from "react";
import axios from 'axios';
import { NavLink, useNavigate } from "react-router-dom";
import Toaster from "./miscellaneous/Toaster";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
    const [toast, setToast] = useState({ state: false, severity: "success", message: "" });
    const [view, setView] = useState(false);
    const [user, setUser] = useState({});
    const navigateTo = useNavigate();

    // FIX: was calling undefined setOpen
    const handleToast = (type, message) => setToast({ state: true, severity: type, message });

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // FIX: e.preventDefault() always at the top
    async function handleSubmit(e) {
        e.preventDefault();
        if (!user.name || !user.username || !user.email || !user.password || !user.confirm) {
            handleToast("error", "Please fill in all fields.");
            return;
        }
        if (user.password !== user.confirm) {
            handleToast("error", "Passwords do not match.");
            return;
        }
        if (!validateEmail(user.email)) {
            handleToast("error", "Invalid email address.");
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/user/api/register`, user);
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userData', JSON.stringify(response.data.userData));
                navigateTo('/app');
            }
        } catch (error) {
            handleToast("error", error?.response?.data || "Registration failed.");
        }
    }

    const handleGoogleSuccess = (credentialResponse) => {
        axios.post(`${import.meta.env.VITE_API_URL}/user/api/google-login`, { credential: credentialResponse.credential })
            .then((res) => {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('userData', JSON.stringify(res.data.userData));
                navigateTo('/app');
            })
            .catch((err) => handleToast("error", err?.response?.data || "Google signup failed."));
    };

    const inputClass = "w-full rounded-xl border border-white/[0.09] bg-[#090d18]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/15 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-400/10";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090d18] p-4 sm:p-6">
            <Toaster toast={toast} setToast={setToast} />

            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.09] bg-[#111827]/95 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/15 bg-gradient-to-br from-indigo-400/20 to-sky-400/10 shadow-lg shadow-indigo-950/30">
                        <MessageSquare size={20} className="text-blue-400" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">We-Convo<span className="text-indigo-300">.</span></span>
                </div>

                <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">Create your account<span className="text-indigo-300">.</span></h1>
                <p className="mb-8 text-sm leading-6 text-slate-400">A better place to keep your conversations going.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 text-xs font-medium">Full name</label>
                            <input type="text" name="name" placeholder="Alex Johnson" autoComplete="off" required
                                onChange={(e) => setUser(p => ({ ...p, [e.target.name]: e.target.value }))}
                                className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 text-xs font-medium">Username</label>
                            <input type="text" name="username" placeholder="alexj" autoComplete="off" required
                                onChange={(e) => setUser(p => ({ ...p, [e.target.name]: e.target.value }))}
                                className={inputClass} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-gray-400 text-xs font-medium">Email address</label>
                        <input type="email" name="email" placeholder="you@example.com" autoComplete="off" required
                            onChange={(e) => setUser(p => ({ ...p, [e.target.name]: e.target.value }))}
                            className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 text-xs font-medium">Password</label>
                            <div className="relative">
                                <input name="password" required type={view ? 'text' : 'password'} placeholder="••••••••"
                                    onChange={(e) => setUser(p => ({ ...p, [e.target.name]: e.target.value }))}
                                    className={`${inputClass} pr-10`} />
                                <button type="button" onClick={() => setView(!view)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                                    {view ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-gray-400 text-xs font-medium">Confirm password</label>
                            <input name="confirm" required type={view ? 'text' : 'password'} placeholder="••••••••"
                                onChange={(e) => setUser(p => ({ ...p, [e.target.name]: e.target.value }))}
                                className={inputClass} />
                        </div>
                    </div>

                    <button type="submit"
                        className="mt-1 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:from-indigo-400 hover:to-blue-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/20">
                        Create account
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <span className="flex-1 h-px bg-[#1e2230]" />
                    <span className="text-gray-600 text-xs">or sign up with</span>
                    <span className="flex-1 h-px bg-[#1e2230]" />
                </div>

                <div className="flex justify-center mb-6">
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => handleToast("error", "Google signup failed.")} />
                </div>

                <p className="text-gray-500 text-sm text-center">
                    Already have an account?{' '}
                    <NavLink to="/" className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200">Sign in</NavLink>
                </p>
            </div>
        </div>
    );
}