import { createSlice } from "@reduxjs/toolkit";
const messageSlice = createSlice({
 name: "messages", initialState: {},
 reducers: {
  cacheMessages(state, action) {
   const { chatId, messages, hasMore } = action.payload || {};
   if (chatId) state[String(chatId)] = { messages: Array.isArray(messages) ? messages : [], hasMore: Boolean(hasMore), loaded: true };
  },
 }
});
export const messageActions = messageSlice.actions;
export default messageSlice.reducer;
