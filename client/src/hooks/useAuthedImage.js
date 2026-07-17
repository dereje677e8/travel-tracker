import { useEffect, useState } from 'react';
import { api } from '../api/axiosClient.js';

/**
 * Photos are served from an auth-gated endpoint (not a public static path),
 * so a plain <img src="/api/..."> won't carry the Authorization header.
 * This fetches the image as a blob (auth header added by the axios
 * interceptor, same as any other request) and exposes an object URL for
 * <img src>, revoking it on cleanup/change to avoid leaking memory.
 */
export function useAuthedImage(path) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return undefined;
    }
    let objectUrl;
    let cancelled = false;

    api.get(path, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return url;
}
