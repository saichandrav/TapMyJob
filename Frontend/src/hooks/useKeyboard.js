import { useEffect } from 'react'

export function useKeyboard({ onCommandK, onEscape, onToggleSidebar, onSlash }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (isEditableTarget) {
        return
      }

      const key = event.key.toLowerCase()

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault()
        onCommandK?.()
      }

      if ((event.metaKey || event.ctrlKey) && key === 'b') {
        event.preventDefault()
        onToggleSidebar?.()
      }

      if (key === 'escape') {
        onEscape?.()
      }

      if (!event.metaKey && !event.ctrlKey && key === '/') {
        event.preventDefault()
        onSlash?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCommandK, onEscape, onSlash, onToggleSidebar])
}
