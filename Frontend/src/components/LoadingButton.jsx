/**
 * LoadingButton — a button that shows a spinner and is disabled while loading.
 *
 * Props:
 *   isLoading  {boolean}  — when true, disables the button and shows a spinner
 *   onClick    {function} — click handler
 *   children   {node}     — button label
 *   className  {string}   — additional Tailwind classes
 *   type       {string}   — button type (default: "button")
 */
export default function LoadingButton({
  isLoading = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || rest.disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded font-semibold
        bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed
        transition-colors ${className}`}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
