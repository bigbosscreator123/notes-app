"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NotesApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data, error } = await supabase.from("notes").select("*");
    if (error) console.error(error);
    else setNotes(data);
  }

  async function addNote() {
    if (!title.trim() || !content.trim()) return; // prevent empty notes
    const { error } = await supabase.from("notes").insert([{ title, content }]);
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

  return (
    <div className="flex flex-col items-center min-h-screen p-8 bg-gray-100">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-6">To Do List</h1>

      {/* Input Form */}
      <div className="w-full max-w-lg flex flex-col gap-4 bg-white p-6 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg text-lg"
        />
        <textarea
          placeholder="How will you acheive this?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-3 rounded-lg text-base h-24"
        />
        <button
          onClick={addNote}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Add Note
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

