import type { JSONContent } from "@tiptap/core";

const LOCAL_ENTRIES_KEY = "junebug_local_entries";

export interface LocalEntry {
  id: string;
  entryDate: string; // ISO date string
  content: JSONContent;
  plainText: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

/**
 * Get all entries from local storage
 */
export function getLocalEntries(): LocalEntry[] {
  try {
    const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LocalEntry[];
  } catch (error) {
    console.error("Failed to get local entries:", error);
    return [];
  }
}

/**
 * Get a single entry by ID from local storage
 */
export function getLocalEntry(id: string): LocalEntry | undefined {
  const entries = getLocalEntries();
  return entries.find((entry) => entry.id === id);
}

/**
 * Save entries array to local storage
 */
function saveLocalEntries(entries: LocalEntry[]): void {
  try {
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to save local entries:", error);
    throw error;
  }
}

/**
 * Create a new entry in local storage
 */
export function createLocalEntry(
  entryDate: Date,
  content: JSONContent,
  plainText: string
): LocalEntry {
  const entries = getLocalEntries();
  const now = Date.now();

  const newEntry: LocalEntry = {
    id: crypto.randomUUID(),
    entryDate: entryDate.toISOString(),
    content,
    plainText,
    createdAt: now,
    updatedAt: now,
  };

  entries.push(newEntry);
  saveLocalEntries(entries);

  return newEntry;
}

/**
 * Update an existing entry in local storage
 */
export function updateLocalEntry(
  id: string,
  updates: {
    content?: JSONContent;
    plainText?: string;
    entryDate?: Date;
  }
): LocalEntry | null {
  const entries = getLocalEntries();
  const index = entries.findIndex((entry) => entry.id === id);

  if (index === -1) {
    console.error("Entry not found:", id);
    return null;
  }

  const entry = entries[index];
  const updatedEntry: LocalEntry = {
    ...entry,
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.plainText !== undefined && { plainText: updates.plainText }),
    ...(updates.entryDate && { entryDate: updates.entryDate.toISOString() }),
    updatedAt: Date.now(),
  };

  entries[index] = updatedEntry;
  saveLocalEntries(entries);

  return updatedEntry;
}

/**
 * Delete an entry from local storage
 */
export function deleteLocalEntry(id: string): boolean {
  const entries = getLocalEntries();
  const filteredEntries = entries.filter((entry) => entry.id !== id);

  if (filteredEntries.length === entries.length) {
    // Entry not found
    return false;
  }

  saveLocalEntries(filteredEntries);
  return true;
}

/**
 * Clear all local entries (used after migration)
 */
export function clearLocalEntries(): void {
  try {
    localStorage.removeItem(LOCAL_ENTRIES_KEY);
  } catch (error) {
    console.error("Failed to clear local entries:", error);
    throw error;
  }
}

/**
 * Check if there are any local entries
 */
export function hasLocalEntries(): boolean {
  return getLocalEntries().length > 0;
}
