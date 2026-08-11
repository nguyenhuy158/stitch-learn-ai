import { Button } from "../ui/Button";
import { api } from "../lib/api";

export default function Login() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-extrabold">AI English</h1>
      <p className="max-w-sm text-sm text-fg-muted">Đăng nhập bằng Google (SSO huyab.click) để tiếp tục.</p>
      <Button size="lg" onClick={() => api.loginWithGoogle()}>
        Đăng nhập với Google
      </Button>
    </div>
  );
}
