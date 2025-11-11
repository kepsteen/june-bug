import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  getLocalEntries,
  clearLocalEntries,
  hasLocalEntries,
} from "./local-storage-entries";

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Migrate all local storage entries to Convex database
 * @param convexClient - The Convex React client instance
 * @returns Result of the migration operation
 */
export async function migrateLocalEntriesToDatabase(
  convexClient: ConvexReactClient
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  };

  // Check if there are any local entries to migrate
  if (!hasLocalEntries()) {
    result.success = true;
    return result;
  }

  const localEntries = getLocalEntries();
  console.log(`Migrating ${localEntries.length} local entries to database...`);

  // Sort entries by creation time to preserve order
  const sortedEntries = [...localEntries].sort(
    (a, b) => a.createdAt - b.createdAt
  );

  // Migrate each entry
  for (const entry of sortedEntries) {
    try {
      await convexClient.mutation(api.entries.createEntry, {
        entryDate: new Date(entry.entryDate).getTime(),
        content: entry.content,
        plainText: entry.plainText,
      });

      result.migratedCount++;
      console.log(`Migrated entry ${entry.id}`);
    } catch (error) {
      result.failedCount++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Failed to migrate entry ${entry.id}: ${errorMessage}`);
      console.error(`Failed to migrate entry ${entry.id}:`, error);
    }
  }

  // Only clear local storage if all entries were successfully migrated
  if (result.failedCount === 0) {
    try {
      clearLocalEntries();
      result.success = true;
      console.log(
        `Successfully migrated ${result.migratedCount} entries and cleared local storage`
      );
    } catch (error) {
      result.success = false;
      result.errors.push("Failed to clear local storage after migration");
      console.error("Failed to clear local storage:", error);
    }
  } else {
    result.success = false;
    console.error(
      `Migration completed with errors: ${result.failedCount} failed, ${result.migratedCount} succeeded`
    );
  }

  return result;
}

/**
 * Check if migration is needed (user has local entries)
 */
export function needsMigration(): boolean {
  return hasLocalEntries();
}
