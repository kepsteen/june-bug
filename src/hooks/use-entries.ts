import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import type { JSONContent } from "@tiptap/core";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  getLocalEntries,
  getLocalEntry,
  createLocalEntry,
  updateLocalEntry,
  deleteLocalEntry,
  type LocalEntry,
} from "../lib/local-storage-entries";

// Unified entry type that works for both local and remote
export type UnifiedEntry = {
  _id: string;
  entryDate: number;
  content: JSONContent;
  plainText: string;
  _creationTime: number;
};

/**
 * Convert local entry to unified format
 */
function localToUnified(local: LocalEntry): UnifiedEntry {
  return {
    _id: local.id,
    entryDate: new Date(local.entryDate).getTime(),
    content: local.content,
    plainText: local.plainText,
    _creationTime: local.createdAt,
  };
}

/**
 * Hook to manage entries with automatic routing between local storage and Convex
 */
export function useEntries(isAuthenticated: boolean) {
  // Convex queries and mutations (only used when authenticated)
  const convexEntries = useQuery(
    api.entries.getEntries,
    isAuthenticated ? {} : "skip"
  );
  const convexCreateEntry = useMutation(api.entries.createEntry);
  const convexUpdateEntry = useMutation(api.entries.updateEntry);
  const convexDeleteEntry = useMutation(api.entries.deleteEntry);

  // Local storage state (only used when not authenticated)
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // Load local entries on mount when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const entries = getLocalEntries();
      setLocalEntries(entries);
      setLocalLoading(false);
    }
  }, [isAuthenticated]);

  // Get all entries
  const entries: UnifiedEntry[] | undefined = isAuthenticated
    ? convexEntries?.map((e) => ({
        _id: e._id,
        entryDate: e.entryDate,
        content: e.content,
        plainText: e.plainText,
        _creationTime: e._creationTime,
      }))
    : localEntries.map(localToUnified);

  // Loading state
  const isLoading = isAuthenticated
    ? convexEntries === undefined
    : localLoading;

  // Create entry
  const createEntry = useCallback(
    async (entryDate: number, content: JSONContent, plainText: string) => {
      if (isAuthenticated) {
        // Stringify content for Convex mutation
        const entryId = await convexCreateEntry({
          entryDate,
          content: JSON.stringify(content),
        });

        // Update with plainText if provided
        if (plainText && entryId) {
          await convexUpdateEntry({
            id: entryId,
            plainText,
          });
        }

        return entryId;
      } else {
        const newEntry = createLocalEntry(
          new Date(entryDate),
          content,
          plainText
        );
        setLocalEntries(getLocalEntries());
        return newEntry.id;
      }
    },
    [isAuthenticated, convexCreateEntry, convexUpdateEntry]
  );

  // Update entry
  const updateEntry = useCallback(
    async (
      entryId: string,
      updates: {
        content?: JSONContent;
        plainText?: string;
      }
    ) => {
      if (isAuthenticated) {
        // Stringify content for Convex mutation
        const convexUpdates: {
          id: Id<"entries">;
          content?: string;
          plainText?: string;
        } = {
          id: entryId as Id<"entries">,
        };

        if (updates.content !== undefined) {
          convexUpdates.content = JSON.stringify(updates.content);
        }

        if (updates.plainText !== undefined) {
          convexUpdates.plainText = updates.plainText;
        }

        await convexUpdateEntry(convexUpdates);
      } else {
        updateLocalEntry(entryId, updates);
        setLocalEntries(getLocalEntries());
      }
    },
    [isAuthenticated, convexUpdateEntry]
  );

  // Delete entry
  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (isAuthenticated) {
        await convexDeleteEntry({ id: entryId as Id<"entries"> });
      } else {
        deleteLocalEntry(entryId);
        setLocalEntries(getLocalEntries());
      }
    },
    [isAuthenticated, convexDeleteEntry]
  );

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}

/**
 * Hook to get a single entry by ID
 */
export function useEntry(entryId: string | undefined, isAuthenticated: boolean) {
  // Convex query (only used when authenticated)
  const convexEntry = useQuery(
    api.entries.getEntry,
    isAuthenticated && entryId ? { id: entryId as Id<"entries"> } : "skip"
  );

  // Local storage state (only used when not authenticated)
  const [localEntry, setLocalEntry] = useState<LocalEntry | undefined>();
  const [localLoading, setLocalLoading] = useState(true);

  // Load local entry when not authenticated
  useEffect(() => {
    if (!isAuthenticated && entryId) {
      const entry = getLocalEntry(entryId);
      setLocalEntry(entry);
      setLocalLoading(false);
    }
  }, [entryId, isAuthenticated]);

  // Get unified entry
  const entry: UnifiedEntry | undefined | null = isAuthenticated
    ? convexEntry
      ? {
          _id: convexEntry._id,
          entryDate: convexEntry.entryDate,
          content: convexEntry.content,
          plainText: convexEntry.plainText,
          _creationTime: convexEntry._creationTime,
        }
      : convexEntry === null
        ? null
        : undefined
    : localEntry
      ? localToUnified(localEntry)
      : localEntry === undefined && !localLoading
        ? null
        : undefined;

  // Loading state
  const isLoading = isAuthenticated
    ? convexEntry === undefined
    : localLoading;

  return {
    entry,
    isLoading,
  };
}
