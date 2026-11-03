import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./ThemeSlice";
import chatReducer from "./ChatSlice";
import onlineReducer from "./OnlineSlice";
import messagesReducer from "./MessageSlice";

const store = configureStore({
    reducer: { theme: themeReducer, chat: chatReducer, online: onlineReducer, messages: messagesReducer }
})

export default store;