# Convo — Frontend

A real-time chat application built with React. Pairs with the [Convo Backend](https://github.com/BugByHarsh/Chat-app-backend).

## Tech Stack

- **React** + **Vite**
- **Redux Toolkit** — global state (chats, theme, online users)
- **Socket.io Client** — real-time messaging and typing indicators
- **Tailwind CSS** — styling
- **Framer Motion** — page transitions and animations
- **@tanstack/react-virtual** — virtual scrolling for message lists
- **Material UI** — form components and toasts
- **Axios** — requests
- **React Router v6** — routing

## Features

- Email/password auth and Google OAuth
- Real-time messaging with typing indicators
- Online/offline presence indicators
- Read receipts (double tick, blue on seen)
- Paginated message history (30 per page, infinite scroll upward)
- Virtual scrolling — only visible messages rendered in the DOM
- Dark/light theme toggle
- Editable user profile

## Getting Started

```bash
git clone https://github.com/BugByHarsh/Chat-app-Frontend.git
cd Chat-app-Frontend
npm install
```

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Then run:

```bash
npm run dev
```

## Socket authentication

The client supplies the current JWT during the Socket.IO handshake. The backend verifies the token and derives the user identity; the client no longer registers an arbitrary user ID.

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   ├── Chat/
│   ├── Layout/
│   ├── User/
│   └── miscellaneous/
├── store/
│   ├── index.js
│   ├── ChatSlice.js
│   ├── ThemeSlice.js
│   └── OnlineSlice.js
└── Utils/
    └── socket.js
```

## Deployment

Set the following environment variables in Vercel:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
