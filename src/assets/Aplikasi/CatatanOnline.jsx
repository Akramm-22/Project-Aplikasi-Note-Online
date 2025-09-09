import React, { useState, useEffect, useRef, useTransition } from "react";

// Custom hook: useLocalStorage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Handle error
    }
  };

  return [storedValue, setValue];
}

// Custom hook: useFetch (sync to API)
function useFetch(url, data, trigger) {
  useEffect(() => {
    if (!trigger) return;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, [url, data, trigger]);
}

const API_URL = "https://jsonplaceholder.typicode.com/posts"; // Dummy API

export default function CatatanOnline() {
  const [notes, setNotes] = useLocalStorage("catatan", []);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [sync, setSync] = useState(false);
  const inputRef = useRef();

  // Sync notes to API when notes change
  useFetch(API_URL, notes, sync);

  // Optimize input: debounce
  const debounceTimeout = useRef();
  const handleInput = (e) => {
    const value = e.target.value;
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setInput(value);
    }, 100);
  };

  const handleAddOrEdit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    startTransition(() => {
      if (editId !== null) {
        setNotes((prev) =>
          prev.map((n) => (n.id === editId ? { ...n, text: input } : n))
        );
        setEditId(null);
      } else {
        setNotes((prev) => [
          ...prev,
          { id: Date.now(), text: input },
        ]);
      }
      setInput("");
      setSync(true);
      setTimeout(() => setSync(false), 500);
    });
  };

  const handleEdit = (id) => {
    const note = notes.find((n) => n.id === id);
    setInput(note.text);
    setEditId(id);
    inputRef.current.focus();
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSync(true);
    setTimeout(() => setSync(false), 500);
  };

  return (
    <div style={styles.bg}>
      <div style={styles.container}>
        <h2 style={styles.title}>📝 Catatan Online</h2>
        <form onSubmit={handleAddOrEdit} style={styles.form}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Tulis catatan..."
            defaultValue={input}
            onChange={handleInput}
            style={styles.input}
            autoComplete="off"
          />
          <button type="submit" style={styles.button} disabled={isPending}>
            {editId !== null ? "💾 Simpan" : "➕ Tambah"}
          </button>
          {isPending && <span style={styles.loading}>⏳</span>}
        </form>
        <ul style={styles.list}>
          {notes.length === 0 && (
            <li style={styles.empty}>Belum ada catatan. Yuk buat satu!</li>
          )}
          {notes.map((note) => (
            <li key={note.id} style={styles.note}>
              <span style={styles.noteText}>{note.text}</span>
              <div>
                <button style={styles.editBtn} onClick={() => handleEdit(note.id)}>
                  ✏️ Edit
                </button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(note.id)}>
                  🗑️ Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  container: {
    width: 520,
    minHeight: 520,
    margin: "48px auto",
    padding: 36,
    background: "rgba(255,255,255,0.98)",
    borderRadius: 32,
    boxShadow: "0 8px 40px #0002, 0 1.5px 0 #2d6cdf22",
    fontFamily: "Segoe UI, sans-serif",
    transition: "box-shadow 0.2s",
  },
  title: {
    textAlign: "center",
    color: "#2d6cdf",
    marginBottom: 32,
    fontSize: 32,
    letterSpacing: 1,
    fontWeight: 700,
    textShadow: "0 2px 8px #2d6cdf22",
  },
  form: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 12,
    border: "1.5px solid #b3c6e0",
    fontSize: 18,
    outline: "none",
    background: "#000000ff",
    transition: "border 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 4px #2d6cdf11",
  },
  button: {
    padding: "12px 22px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(90deg, #2d6cdf 60%, #6fb1fc 100%)",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 2px 8px #2d6cdf22",
    transition: "background 0.2s, transform 0.1s",
  },
  loading: {
    marginLeft: 12,
    color: "#2d6cdf",
    fontSize: 20,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    minHeight: 220,
  },
  note: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#e3f0ff",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 12,
    boxShadow: "0 2px 8px #2d6cdf11",
    fontSize: 18,
    fontWeight: 500,
    transition: "background 0.2s, box-shadow 0.2s",
  },
  noteText: {
    wordBreak: "break-word",
    maxWidth: 320,
    color: "#2d6cdf",
    fontWeight: 500,
    fontSize: 18,
  },
  editBtn: {
    marginRight: 8,
    background: "#ffd600",
    border: "none",
    borderRadius: 8,
    padding: "6px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
    boxShadow: "0 1px 4px #ffd60033",
    transition: "background 0.2s, transform 0.1s",
  },
  deleteBtn: {
    background: "#ff5252",
    border: "none",
    borderRadius: 8,
    padding: "6px 16px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 15,
    boxShadow: "0 1px 4px #ff525233",
    transition: "background 0.2s, transform 0.1s",
  },
  empty: {
    textAlign: "center",
    color: "#b3c6e0",
    fontStyle: "italic",
    fontSize: 18,
    marginTop: 40,
  },
};
