import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
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
  const queryClient = useQueryClient();

  // Convex queries and mutations (only used when authenticated)
  const { data: convexEntries } = useQuery(
    convexQuery(api.entries.getEntries, isAuthenticated ? {} : "skip")
  );
  const { mutateAsync: convexCreateEntry } = useMutation({
    mutationFn: useConvexMutation(api.entries.createEntry),
  });
  const { mutateAsync: convexUpdateEntry } = useMutation({
    mutationFn: useConvexMutation(api.entries.updateEntry),
    onMutate: async (variables: {
      id: Id<"entries">;
      content?: string;
      plainText?: string;
    }) => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: convexQuery(api.entries.getEntry, {
          id: variables.id,
        }).queryKey,
      });

      // Snapshot the previous value for rollback on error
      const previousEntry = queryClient.getQueryData(
        convexQuery(api.entries.getEntry, { id: variables.id }).queryKey
      );

      // Optimistically update the single entry cache
      queryClient.setQueryData(
        convexQuery(api.entries.getEntry, { id: variables.id }).queryKey,
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            content: variables.content ?? old.content,
            plainText: variables.plainText ?? old.plainText,
          };
        }
      );

      return { previousEntry };
    },
    onError: (err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousEntry) {
        queryClient.setQueryData(
          convexQuery(api.entries.getEntry, { id: variables.id }).queryKey,
          context.previousEntry
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure we're in sync with server
      // This happens after the mutation completes, preventing race conditions
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.entries.getEntry, {
          id: variables.id,
        }).queryKey,
      });
    },
  });
  const { mutateAsync: convexDeleteEntry } = useMutation({
    mutationFn: useConvexMutation(api.entries.deleteEntry),
  });

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
        content: JSON.parse(e.content) as JSONContent,
        plainText: e.plainText || '',
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
  const { data: convexEntry } = useQuery(
    convexQuery(
      api.entries.getEntry,
      isAuthenticated && entryId ? { id: entryId as Id<"entries"> } : "skip"
    )
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
          content: JSON.parse(convexEntry.content) as JSONContent,
          plainText: convexEntry.plainText || '',
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
