import { useState, useEffect } from 'react'

const STORAGE_KEY = 'rightSidebarCollapsed'

export function useCollapsibleRightSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage, default to collapsed
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : true
  })

  useEffect(() => {
    // Persist collapse state to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
  }, [isCollapsed])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return {
    isCollapsed,
    toggleCollapse,
  }
}
