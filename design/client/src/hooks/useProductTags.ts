import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

const PRODUCTS_LIMIT = 150;

/**
 * Fetches unique product tags from Firestore (from products the admin added when uploading).
 * Used for the header tag chips so they reflect actual catalog tags.
 */
export function useProductTags(): { tags: string[]; loading: boolean } {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocs(query(collection(db, "products"), limit(PRODUCTS_LIMIT)))
      .then((snap) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const list: string[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          const productTags = data?.tags;
          if (Array.isArray(productTags)) {
            productTags.forEach((t: unknown) => {
              const tag = typeof t === "string" ? t.trim() : "";
              if (tag && !seen.has(tag.toLowerCase())) {
                seen.add(tag.toLowerCase());
                list.push(tag);
              }
            });
          }
        });
        list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        setTags(list);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { tags, loading };
}
