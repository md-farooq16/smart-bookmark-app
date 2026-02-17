"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { supabase } from "@/lib/supabase";

interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  created_at: string;
}

// Icons
const BookmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
);

const LoaderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default function Home() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
      
      const subscription = supabase
        .channel("bookmarks-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newBookmark = payload.new as Bookmark;
              setBookmarks((prev) => [newBookmark, ...prev]);
            } else if (payload.eventType === "DELETE") {
              const deletedBookmark = payload.old as Bookmark;
              setBookmarks((prev) => prev.filter((b) => b.id !== deletedBookmark.id));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    const filtered = bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBookmarks(filtered);
  }, [searchQuery, bookmarks]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title || !user) return;

    try {
      setIsAdding(true);
      let finalUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        finalUrl = `https://${url}`;
      }

      const { error } = await supabase.from("bookmarks").insert([
        {
          url: finalUrl,
          title,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      setUrl("");
      setTitle("");
    } catch (err) {
      console.error("Error adding bookmark:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Error deleting bookmark:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center gap-4">
          <LoaderIcon />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // STUNNING LOGIN PAGE
    // STUNNING LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex items-center justify-center p-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs - Smaller and more centered */}
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          
          {/* Grid Pattern - More subtle */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
          
          {/* Floating Particles - Fewer and smaller */}
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-500" />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-1000" />
        </div>

        {/* Main Card - Compact and Centered */}
        <div className="relative z-10 w-full max-w-sm">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl blur opacity-20" />
          
          <div className="relative bg-[#13131f]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
            {/* Logo - Smaller */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-md opacity-40" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Title - Smaller */}
            <h1 className="text-3xl font-bold text-center mb-2">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Smart Bookmark
              </span>
            </h1>
            
            <p className="text-gray-400 text-center text-base mb-1">
              Your personal knowledge library
            </p>
            <p className="text-gray-500 text-center text-sm mb-8">
              Save and organize your favorite links
            </p>

            {/* Features - Horizontal and compact */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/10 rounded-lg flex items-center justify-center text-lg border border-purple-500/20">
                  ⚡
                </div>
                <p className="text-xs text-gray-400">Sync</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/10 rounded-lg flex items-center justify-center text-lg border border-blue-500/20">
                  🔒
                </div>
                <p className="text-xs text-gray-400">Secure</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 bg-indigo-500/10 rounded-lg flex items-center justify-center text-lg border border-indigo-500/20">
                  🚀
                </div>
                <p className="text-xs text-gray-400">Fast</p>
              </div>
            </div>

            {/* Google Sign In - Clean */}
            <button
              onClick={signInWithGoogle}
              className="group w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[1]"
            >
              <div className="w-5 h-5">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="text-sm">Continue with Google</span>
            </button>

            <p className="text-center text-xs text-gray-500 mt-6">
              Powered by <span className="text-purple-400">Supabase</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP (LOGGED IN)
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
              <BookmarkIcon />
            </div>
            <span className="font-bold text-xl text-gray-800 hidden sm:block">Smart Bookmark</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Bookmark Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PlusIcon />
            <span>Add New Bookmark</span>
          </h2>
          
          <form onSubmit={addBookmark} className="space-y-3">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              required
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <LoaderIcon />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusIcon />
                  <span>Add Bookmark</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">
            {filteredBookmarks.length} {filteredBookmarks.length === 1 ? "bookmark" : "bookmarks"}
          </span>
        </div>

        {/* Bookmarks List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <LoaderIcon />
              <p className="mt-2">Loading your bookmarks...</p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🔖
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {searchQuery ? "No matches found" : "No bookmarks yet"}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? "Try a different search term" : "Add your first bookmark above"}
              </p>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-purple-200 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {bookmark.title.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate mb-1 group-hover:text-purple-600 transition-colors">
                      {bookmark.title}
                    </h3>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 truncate"
                    >
                      {getDomain(bookmark.url)}
                      <ExternalLinkIcon />
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      Added {formatDate(bookmark.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    disabled={deletingId === bookmark.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === bookmark.id ? <LoaderIcon /> : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}