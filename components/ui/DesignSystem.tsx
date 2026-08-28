import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Card({ children, className = "", tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "muted" | "accent" | "danger" }) {
  return <section className={`rs-card rs-card-${tone} ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  return <span className={`rs-badge rs-badge-${tone}`}>{children}</span>;
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={`rs-button rs-button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`rs-input ${props.className ?? ""}`} />;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="rs-state rs-empty"><div className="rs-state-icon" aria-hidden="true">—</div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return <div className="rs-state rs-loading" role="status"><span className="rs-spinner" aria-hidden="true" />{label}</div>;
}

export function ErrorState({ title = "Terjadi kesalahan", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="rs-state rs-error" role="alert"><div className="rs-state-icon" aria-hidden="true">!</div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function Toast({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" }) {
  return <div className={`rs-toast rs-toast-${tone}`} role="status">{children}</div>;
}
