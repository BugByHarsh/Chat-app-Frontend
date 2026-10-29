import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { OnlineActions } from "../store/OnlineSlice";

// Attach the current JWT at handshake time. The server verifies it and derives
// the user ID from the token; clients must not be allowed to register arbitrary IDs.
const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  auth: (callback) => callback({ token: localStorage.getItem("token") }),
});

export default function useSocket() {
  const dispatch = useDispatch();

  useEffect(() => {
    const onOnlineUsers = (users) => {
      dispatch(OnlineActions.create(Array.isArray(users) ? users : []));
    };

    socket.on("getOnlineUsers", onOnlineUsers);
    return () => {
      socket.off("getOnlineUsers", onOnlineUsers);
    };
  }, [dispatch]);
}

export { socket };
