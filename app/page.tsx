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
};

export default function NotesApp() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
    });
  }, []);

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchNotes();
  // }, []);

  // useEffect(() => {
  //   const fetchName = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) return;

  //     const { data, error } = await supabase
  //       .from("user_settings")
  //       .select("name")
  //       .eq("id", user.id)
  //       .single();

  //     if (!error && data) {
  //       setName(data.name || "");
  //       setIsEditing(!data.name); // edit if first time
  //     }
  //   };

  //   fetchName();
  // }, []);

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

    const {data: notesData} = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id);

    setNotes(notesData || []);
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
      .eq("user_id", user.id);

    if (error) console.error(error);
    else setNotes(data || []);
  }

  async function addNote() {
    if (!title.trim() || !content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to add a note");
      return;
    }

    const { error } = await supabase.from("notes").insert([
      { title, content, user_id: user.id }
    ]);

    if (error) console.error(error);
    else {
      setTitle("");
      setContent("");
      fetchNotes();
    }
  }

  async function deleteNote(id: number) {
    const { error } = await supabase.from("notes").delete().eq("id", id);
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
    <div className="flex flex-col items-center min-h-screen p-8 bg-rose-50">
      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-6 mt-50">
        Good morning,{" "}
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
      <div className="w-full max-w-lg flex flex-col gap-4 bg-white p-6 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded-lg text-md"
        />
        <input
          type="text"
          placeholder="How will you achieve this?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 rounded-lg text-md"
        />
        <button
          onClick={addNote}
          className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition"
        >
          commit
        </button>
      </div>

      {/* Notes List */}
      <div className="w-full max-w-lg mt-8 space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-start"
          >
            <div>
              <h2 className="text-xl font-semibold">{note.title}</h2>
              <p className="text-gray-700">{note.content}</p>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
