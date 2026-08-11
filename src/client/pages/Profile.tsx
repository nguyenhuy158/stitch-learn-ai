import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { ThemePicker } from "../theme/ThemePicker";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((data) => {
        if (!data.user) return navigate("/login");
        setUser(data.user);
      })
      .finally(() => setLoaded(true));
  }, [navigate]);

  if (!loaded) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl p-5 sm:p-9">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.name || user.email || "?"} src={user.avatar_url} size="lg" />
        <div>
          <div className="text-xl font-bold">{user.name || "Chưa đặt tên"}</div>
          <div className="text-sm text-fg-muted">{user.email}</div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2.5 text-center">
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.streak || 0}</div>
          <div className="text-[11px] text-fg-muted">Chuỗi ngày</div>
        </Card>
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.xp || 0}</div>
          <div className="text-[11px] text-fg-muted">XP</div>
        </Card>
        <Card className="p-3">
          <div className="text-lg font-extrabold text-primary">{user.level || "B1"}</div>
          <div className="text-[11px] text-fg-muted">Trình độ</div>
        </Card>
      </div>

      <div className="mb-2 text-sm font-bold text-fg-muted">Cài đặt & Tùy chọn</div>
      <Card padded={false} className="mb-6 divide-y divide-border overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm">Ngôn ngữ</span>
          <span className="text-sm text-fg-muted">Tiếng Việt</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm">Giọng đọc & Phát âm</span>
          <span className="text-sm text-fg-muted">Mặc định</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm">Giao diện</span>
          <ThemePicker />
        </div>
      </Card>

      <div className="mb-2 text-sm font-bold text-fg-muted">Trợ giúp & Phản hồi</div>
      <Card padded={false} className="mb-6 overflow-hidden">
        <Link to="/help" className="block p-4 text-sm no-underline">
          Trợ giúp & Phản hồi →
        </Link>
      </Card>

      <button
        type="button"
        onClick={() => api.logout()}
        className="w-full rounded-ui border border-danger py-3 text-sm font-semibold text-danger"
      >
        Đăng xuất
      </button>

      <p className="mt-6 text-center text-xs text-fg-muted">Phiên bản 2.4.0 (Bản dựng 2026)</p>
    </div>
  );
}
