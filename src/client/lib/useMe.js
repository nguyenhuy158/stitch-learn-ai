import { useEffect, useState } from "react";
import { api } from "./api";

/** GET /api/auth/me on mount. `user` stays null while loading or logged out. */
export function useMe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((data) => {
        if (alive) setUser(data.user || null);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading, refetch: () => api.me().then((d) => setUser(d.user || null)) };
}
