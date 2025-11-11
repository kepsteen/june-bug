import { useState, useRef, useEffect, useCallback } from 'react'

const MIN_WIDTH = 200
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 280

export function useResizableSidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth')
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')

    if (savedWidth) {
      setSidebarWidth(Number(savedWidth))
    }
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true')
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString())
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
  }, [sidebarWidth, isCollapsed])

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
          setSidebarWidth(newWidth)
        }
      }
    },
    [isResizing],
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)

    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  return {
    sidebarWidth,
    isCollapsed,
    isResizing,
    sidebarRef,
    startResizing,
    toggleCollapse,
  }
}
