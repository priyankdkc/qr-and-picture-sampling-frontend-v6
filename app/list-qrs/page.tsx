"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Image from "next/image";
import Loader from "@/components/ui/Loader";
import { StyleItem } from "@/types/type";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [items, setItems] = useState<StyleItem[]>([]);
  const [originalItems, setOriginalItems] = useState<StyleItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
    } else {
      setToken(token);
      setAuthorized(true);
    }
  }, [router]);

  const handleFetch = async (pageNumber = 1) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/list-qr-for-names/?page=${pageNumber}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error("List fetch failed");
      }

      const data = await res.json();

      setTotalPages(data.total_pages);
      setPage(data.current_page);

      const mapped = data.results.map((item: StyleItem) => ({
        id: item.id,
        qr_code: item.qr_code,
        picture: item.picture,
        style_name: item.style_name || "",
        created_by: item.created_by,
        updated_by: item.updated_by,
      }));

      setItems(mapped);
      setOriginalItems(mapped);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load QR list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch(page);
  }, [page]);

  const handleChange = useCallback((id: string, value: string) => {
    const upperValue = value.toUpperCase();

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, style_name: upperValue } : item
      ),
    );
  }, []);

  const handleBlur = useCallback(
    async (id: string, value: string) => {
      const trimmedValue = value.trim();

      if (!trimmedValue) return;

      const original = originalItems.find((item) => item.id === id);
      if (!original || original.style_name === trimmedValue) return;

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/update-style-name/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
              id,
              style_name: trimmedValue,
            }),
          },
        );

        setOriginalItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, style_name: trimmedValue } : item
          ),
        );
      } catch (err) {
        console.error("Failed to update style number", err);
      }
    },
    [originalItems, token],
  );

  if (!authorized) return "Loading...";

  return (
    <>
      <Header />
      <p className="text-red-500 text-center mb-12 font-bold text-xl sticky top-12 z-40 bg-white p-2">Agar "no name" kahi dikhe tag pr to chord dena use</p>

      <main className="relative min-h-screen px-6 py-10 pb-28">
        
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <Loader fullscreen color="#1E90FF" size={18} />
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-20">
          {error && <p className="text-center text-red-500">{error}</p>}

          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-col lg:flex-row items-start"
            >
              <div className="w-full lg:w-1/3">
                <div
                  className="relative w-full h-52 overflow-hidden rounded-2xl cursor-pointer flex items-center"
                  onClick={() => setSelectedImage(item.picture)}
                >
                  <span className="text-3xl font-bold"> {idx + 1}</span>
                  <Image
                    src={item.picture}
                    alt="preview"
                    fill
                    className="object-contain transition-transform duration-700"
                  />
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col justify-center mt-8 lg:mt-0">
                <div className="space-y-8">
                  <div className="relative group">
                    <input
                      type="text"
                      value={item.style_name}
                      onChange={(e) => handleChange(item.id, e.target.value)}
                      onBlur={(e) => handleBlur(item.id, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 outline-none text-3xl font-semibold tracking-widest uppercase py-2 transition duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center gap-6 pt-10">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
        >
          Previous
        </button>

        <span className="font-semibold">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
      </main>

      

      {selectedImage && (
        <div
          className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-4xl h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold cursor-pointer"
            >
              ✕
            </button>

            <Image
              src={selectedImage}
              alt="Large preview"
              fill
              className="object-contain rounded-xl transition-transform duration-500"
            />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Page;