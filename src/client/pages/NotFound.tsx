import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-sm text-fg-muted">Không tìm thấy trang.</p>
      <Link to="/" className="text-sm font-semibold text-primary no-underline">
        Về Home
      </Link>
    </div>
  );
}
