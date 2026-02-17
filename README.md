# Smart Bookmark App

A modern, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can securely save, search, and manage their bookmarks with Google OAuth authentication and real-time synchronization across devices.

## 🚀 Live Demo

[View Live Demo](https://your-vercel-url.vercel.app) *(Add your Vercel URL here)*

## ✨ Features

- **Google OAuth Authentication** - Secure login with Google (no email/password)
- **Private Bookmarks** - Each user has their own private collection
- **Real-time Sync** - Bookmarks update instantly across all open tabs
- **Smart Search** - Filter bookmarks by title or URL
- **Clean UI** - Modern, responsive design with Tailwind CSS
- **Fast Performance** - Built with Next.js App Router for optimal speed

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Google Cloud Console account (for OAuth credentials)
- GitHub account

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/md-farooq16/smart-bookmark-app.git
cd smart-bookmark-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run this SQL to create the bookmarks table:

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks" 
  ON bookmarks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" 
  ON bookmarks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
  ON bookmarks FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google OAuth API
4. Create OAuth credentials (Web application)
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
6. Copy Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers → Google
8. Paste credentials and save

### 5. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 6. Run Locally

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see the app.

## 📱 Usage

1. **Login** - Click "Continue with Google" to authenticate
2. **Add Bookmark** - Enter URL and title, click "Add Bookmark"
3. **Search** - Use the search bar to filter bookmarks
4. **Delete** - Click the trash icon on any bookmark to remove it
5. **Real-time** - Open multiple tabs and see updates instantly

## 🐛 Challenges & Solutions

### Challenge 1: Google OAuth Redirect Issues
**Problem**: The OAuth redirect wasn't working properly in production.
**Solution**: Ensured all redirect URLs were properly configured in both Google Cloud Console and Supabase dashboard. Used environment variables for different environments.

### Challenge 2: Real-time Subscriptions
**Problem**: Bookmarks weren't updating in real-time across tabs.
**Solution**: Implemented Supabase Realtime subscriptions with proper channel configuration and cleanup on unmount. Used the `postgres_changes` listener with user-specific filters.

### Challenge 3: URL Format Validation
**Problem**: Users were entering URLs without protocols (e.g., "google.com").
**Solution**: Added URL validation and automatic protocol prefix (https://) if missing. Used try-catch for URL parsing to handle invalid inputs gracefully.

### Challenge 4: Loading States
**Problem**: Poor user experience during async operations.
**Solution**: Implemented loading spinners, disabled states, and skeleton loaders for all async operations (auth, adding, deleting).

### Challenge 5: Embedded Git Repository
**Problem**: Accidentally created a git repository in the parent folder.
**Solution**: Removed the nested .git folder and reinitialized in the correct directory.

## 📁 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── auth-provider.tsx    # Authentication context
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts     # OAuth callback handler
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main app page
│   └── globals.css          # Global styles
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── supabase-server.ts   # Server-side Supabase
├── public/                  # Static assets
├── .env.local               # Environment variables
└── package.json             # Dependencies
```

## 🚢 Deployment on Vercel

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Md Farooq**
- GitHub: [@md-farooq16](https://github.com/md-farooq16)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the real-time backend
- Tailwind CSS for the utility-first CSS framework
- Vercel for seamless deployment

---

**Built with ❤️ for the Smart Bookmark App Challenge**
