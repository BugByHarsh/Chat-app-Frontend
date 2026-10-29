import { createSlice } from "@reduxjs/toolkit";

const idOf = (value) => value == null ? "" : String(value._id ?? value);

const sortByRecentMessage = (chats) => {
  chats.sort((a, b) => {
    const aTime = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

const chatSlice = createSlice({
  name: "Chats",
  initialState: [],
  reducers: {
    createChat(state, action) {
      const chats = Array.isArray(action.payload) ? action.payload : [];
      sortByRecentMessage(chats);
      return chats;
    },
    updateChat(state, action) {
      const message = action.payload;
      const chatId = idOf(message?.chatId);
      const chatIndex = state.findIndex((chat) => idOf(chat._id) === chatId);
      if (chatIndex !== -1) {
        state[chatIndex].latestMessage = message;
        sortByRecentMessage(state);
      }
    },
    // The current user has opened this conversation. Only an incoming latest
    // message should be marked read in the sidebar.
    markChatRead(state, action) {
      const { chatId, userId } = action.payload || {};
      const chat = state.find((item) => idOf(item._id) === idOf(chatId));
      const latest = chat?.latestMessage;
      if (latest && userId && idOf(latest.sender) !== idOf(userId)) {
        latest.isRead = true;
      }
    },
    // The other participant has read a message sent by the current user.
    markLatestMessageRead(state, action) {
      const { chatId, userId } = action.payload || {};
      const chat = state.find((item) => idOf(item._id) === idOf(chatId));
      const latest = chat?.latestMessage;
      if (latest && userId && idOf(latest.sender) === idOf(userId)) {
        latest.isRead = true;
      }
    },
    appendChat(state, action) {
      const chat = action.payload;
      const exists = state.some((item) => idOf(item._id) === idOf(chat?._id));
      if (!exists && chat) {
        state.unshift(chat);
        sortByRecentMessage(state);
      }
    }
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
