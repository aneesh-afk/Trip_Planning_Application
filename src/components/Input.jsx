// Shared Input — see UI_SCHEMA.md section 5.
// Label above field (text-label style), error state turns border/message danger-colored.

export default function Input({ label, id, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="font-body text-label uppercase tracking-wide font-medium text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`font-body text-body bg-surface border rounded-sm px-3 py-2.5 text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-route ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...props}
      />
      {error && <p className="font-body text-small text-danger">{error}</p>}
    </div>
  );
}
