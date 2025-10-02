"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Note = {
  id: number;
  title: string;
  content: string;
  completed: boolean;
};

export default function NotesApp() {
  const nameInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
    });
  }, []);

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [adding, setAdding] = useState (false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [currentTime,setCurrentTime] = useState("");
  const [goalsOpen, setGoalsOpen] = useState(false);

async function toggleComplete(noteId: number, current: boolean) {
  const { error } = await supabase
    .from("notes")
    .update({completed: !current })
    .eq("id", noteId);

    if (error) console.error(error);
    else fetchNotes();
}

  function getFormattedTime() {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    setGreeting(getGreeting());
    setCurrentTime(getFormattedTime());

    const now = new Date();
    const msUntilNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setGreeting(getGreeting());
      setCurrentTime(getFormattedTime());

    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setCurrentTime(getFormattedTime());
    }, 60 * 1000);

      return () => clearInterval(interval);
    }, msUntilNextMin);

    return () => clearTimeout(timeout);
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >=5 && hour < 12) return "Good morning";
    if (hour >=12 && hour < 20) return "Good afternoon";
    if (hour >=20 && hour < 24) return "Good evening";
    return "Good night";
  }

  useEffect (() => {
    setGreeting(getGreeting());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const { data: {user} } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

    const {data: userData} = await supabase
      .from("user_settings")
      .select("name")
      .eq("id", user.id)
      .single();

    if (userData) {
      setName(userData.name || "");
      setIsEditing(!userData.name);
    }

    await fetchNotes();
    setLoading(false);
  };
  loadData();
  }, []);

  async function fetchNotes() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: true });

    if (error) console.error(error);
    else setNotes(data || []);
  }

      async function addNote() {
      if (!title.trim()) return;

      setAdding(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to add a note");
        setAdding(false);
        return;
      }

      const { error } = await supabase.from("notes").insert([
        { title, content: "", user_id: user.id }
      ]);

      setAdding(false);
      if (error) console.error(error);
      else {
        setTitle("");
        fetchNotes();
      }
    }

  async function deleteNote(id: number) {
    setDeleting(id);
    const { error } = await supabase.from("notes").delete().eq("id", id);
    setDeleting(null);
    if (error) console.error(error);
    else fetchNotes();
  }

  async function saveName() {
    const trimmedName = name.trim();
  
    if (!trimmedName) {
      setName("");
      nameInputRef.current?.focus();
      return;
    }
    setIsEditing(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_settings").upsert({
      id: user.id,
      name: trimmedName,
    });
  }

  // Handle key press events
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      await saveName();
    }
  };

  const handleBlur = async () => {
    const trimmedName = name.trim();
     if (!trimmedName) {
      setName("");
      setIsEditing(false);
      return;
    }
    await saveName();
  };

  if(loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rose-50">
        <p className="text-sm text-black-700">one sec :)</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-pink-200">
    {goalsOpen && (
     <div className="fixed top-40 left-10 w-80 bg-white p-4 rounded">
        <h2 className="text-xl font-bold mb-4 text-center">Today&apos;s Goals</h2>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white p-2 flex justify-between items-center rounded shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={note.completed}
                onChange={() => toggleComplete(note.id, note.completed)}
                className="h-4 w-4 text-blue-500 border-gray-300 rounded"
              />
              <span
                className={`text-m font-semibold ${
                  note.completed ? "line-through text-gray-400" : ""
                }`}
              >
                {note.title}
              </span>
            </div>

            <button
              onClick={() => deleteNote(note.id)}
              disabled={deleting === note.id}
              className={`px-3 py-1 rounded transition ${
                deleting === note.id
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-500 hover:text-red-700"
              }`}
            >
              {deleting === note.id ? "deleting..." : "delete"}
            </button>
          </div>
        ))}
        </div>
      </div>
      )}
      <button
          onClick={() => setGoalsOpen(!goalsOpen)}
          className="fixed bottom-20 left-10 px-5 py-3 rounded-full shadow-lg bg-black-600 text-black hover:bg-amber-500"
        >
          {goalsOpen ? "hide task" : "show task"}
        </button>

    <div className="top-6 text-6xl font-block mt-20 text-black-500 mt-50">
      {currentTime}
      </div>
      <h1 className="text-4xl font-bold mb-6 mt-10">
        {greeting}, {" "}
        {isEditing ? (
          <input
            ref={nameInputRef}
            type="text"
            placeholder="name?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            className="bg-transparent border-b border-gray-400 text-center outline-none"
            style={{ width: `${Math.max((name.length + 1) * 1.1, 6)}ch` }}
          />
        ) : (
          <span 
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer hover:text-yellow-600 transition-colors transition-colors ${
              !name ? "underline text-black/20 italic" : ""
        }`}
          >
            {name || "name?"} 
          </span>
        )}
      </h1>

    {/* Input Form */}
    <div className="w-full max-w-xl">
      <div className="relative flex items-center bg-white rounded-xl shadow-md">
        <input
          type="text"
          placeholder="What are todays goals?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addNote();
            }
          }}
          className="flex-1 border-none p-4 rounded-xl text-md outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={addNote}
          disabled={adding || !title.trim()}
          className={`absolute right-2 p-2 rounded-lg transition ${
            adding || !title.trim()
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gray-400 hover:bg-amber-500"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
}