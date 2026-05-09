import { useEffect, useState } from 'react';

/**
 * Notification — dismissible toast in the top-right corner.
 *
 * Props:
 *   message  {string}                    — text to display
 *   type     {'error'|'success'|'info'}  — controls color scheme
 *   onDismiss {function}                 — called when dismissed (manually or after timeout)
 */
export default function Notification({ message, type = 'info', onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!visible || !message) return null;

  const colorMap = {
    error:   'bg-red-600 text-white',
    success: 'bg-green-600 text-white',
    info:    'bg-blue-700 text-white',
  };

  const colors = colorMap[type] ?? colorMap.info;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 max-w-sm w-full
        rounded shadow-lg px-4 py-3 ${colors}`}
    >
      <span className="flex-1 text-sm">{message}</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="ml-2 text-white/80 hover:text-white text-lg leading-none"
      >
        &times;
      </button>
    </div>
  );
}
