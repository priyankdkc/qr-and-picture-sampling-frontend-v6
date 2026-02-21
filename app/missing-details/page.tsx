"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Loader from "@/components/ui/Loader";
import { useRouter } from "next/navigation";

interface MissingItem {
  id: string;
  qr_code: string;
  picture: string | null;
  style_number: string;
  created_by: string | null;
  updated_by: string | null;
}

export default function Page() {
  const router = useRouter();

  const [items, setItems] = useState<MissingItem[]>([]);
  const [originalItems, setOriginalItems] = useState<MissingItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
    } else {
      setToken(token);
      setAuthorized(true);
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/missing-picture-or-name/`,
      );

      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      setItems(data);
      setOriginalItems(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load missing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleChange = useCallback((id: string, value: string) => {
    const upper = value.toUpperCase();

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, style_number: upper } : item,
      ),
    );
  }, []);

  const handleBlur = useCallback(
    async (id: string, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      const original = originalItems.find((item) => item.id === id);
      if (!original || original.style_number === trimmed) return;

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/update-style-number/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
              id,
              style_number: trimmed,
            }),
          },
        );

        setOriginalItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, style_number: trimmed } : item,
          ),
        );
      } catch (err) {
        console.error("Update failed", err);
      }
    },
    [originalItems, token],
  );

  if (!authorized) return "Loading...";

  return (
    <>
      <Header />

      <main className="relative min-h-screen p-6 pb-28">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <Loader fullscreen color="#1E90FF" size={18} />
          </div>
        )}

        {error && <p className="text-center text-red-500 mb-4">{error}</p>}

        <div className="bg-white shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">QR Code</th>
                  <th className="px-4 py-3">Picture</th>
                  <th className="px-4 py-3">Style Number</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Updated By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">{index + 1}</td>

                    <td className="px-4 py-3">{item.qr_code}</td>

                    <td className="px-4 py-3">
                      {item.picture ? (
                        <img
                          src={item.picture}
                          alt="thumbnail"
                          onClick={() => setSelectedImage(item.picture!)}
                          className="w-48 h-48 object-cover rounded border cursor-pointer hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center border rounded text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.style_number || ""}
                        onChange={(e) => handleChange(item.id, e.target.value)}
                        onBlur={(e) => handleBlur(item.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-3">{item.created_by}</td>

                    <td className="px-4 py-3">{item.updated_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold"
            >
              ✕
            </button>

            <img
              src={selectedImage}
              alt="Large preview"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
