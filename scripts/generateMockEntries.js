#!/usr/bin/env node

/**
 * Generate mock journal entries for testing
 *
 * Usage:
 *   node scripts/generateMockEntries.js --email "user@example.com" --count 10 --startDate "2025-01-01"
 *   npm run generate-mock-entries -- --email "user@example.com" --count 10 --startDate "2025-01-01"
 *
 * Parameters:
 *   --email      User email (required)
 *   --count      Number of entries to generate (default: 10)
 *   --startDate  Start date in YYYY-MM-DD format (default: today)
 */

import { ConvexHttpClient } from 'convex/browser'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (name) => {
  const index = args.indexOf(`--${name}`)
  return index !== -1 ? args[index + 1] : null
}

const email = getArg('email')
const count = parseInt(getArg('count') || '10', 10)
const startDateStr = getArg('startDate')

if (!email) {
  console.error('Error: --email argument is required')
  console.log('\nUsage:')
  console.log(
    '  node scripts/generateMockEntries.js --email "user@example.com" --count 10 --startDate "2025-01-01"',
  )
  console.log(
    '  npm run generate-mock-entries -- --email "user@example.com" --count 10 --startDate "2025-01-01"',
  )
  console.log('\nParameters:')
  console.log('  --email      User email (required)')
  console.log('  --count      Number of entries (default: 10)')
  console.log('  --startDate  Start date in YYYY-MM-DD format (default: today)')
  process.exit(1)
}

// Parse startDate if provided
let startDate = null
if (startDateStr) {
  startDate = new Date(startDateStr)
  if (isNaN(startDate.getTime())) {
    console.error(
      `Error: Invalid date format "${startDateStr}". Use YYYY-MM-DD format.`,
    )
    process.exit(1)
  }
  // Set to midnight
  startDate.setHours(0, 0, 0, 0)
}

// Load environment variables
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const convexUrl = process.env.VITE_CONVEX_URL
if (!convexUrl) {
  console.error('Error: VITE_CONVEX_URL not found in environment variables')
  console.log('Make sure you have a .env.local file with VITE_CONVEX_URL set')
  process.exit(1)
}

// Initialize Convex client
const client = new ConvexHttpClient(convexUrl)

async function generateMockEntries() {
  try {
    const startDateDisplay = startDate
      ? startDate.toLocaleDateString()
      : 'today'
    console.log(
      `\nGenerating ${count} mock entries for ${email} starting from ${startDateDisplay}...`,
    )

    const mutationArgs = {
      email,
      count,
    }

    // Add startDate if provided
    if (startDate) {
      mutationArgs.startDate = startDate.getTime()
    }

    const result = await client.mutation(
      'mockData:generateMockEntries',
      mutationArgs,
    )

    console.log(`\n✅ ${result.message}`)
    console.log(`\nCreated entries:`)
    result.entries.forEach((entry) => {
      console.log(`  - ${entry.date} (${entry.wordCount} words)`)
    })
    console.log('\nDone!')
  } catch (error) {
    console.error('\n❌ Error generating mock entries:')
    console.error(error.message)
    process.exit(1)
  }
}

generateMockEntries()
