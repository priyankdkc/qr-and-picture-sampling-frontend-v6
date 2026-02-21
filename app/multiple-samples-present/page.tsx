"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import Loader from "@/components/ui/Loader";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface MultipleSamplesItem {
  id: string;
  multiple_samples_present: boolean;
  picture: string | null;
}

export default function Page() {
  const router = useRouter();

  const [items, setItems] = useState<MultipleSamplesItem[]>([]);
  const [originalItems, setOriginalItems] = useState<MultipleSamplesItem[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/list-multiple-samples-present/`,
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
    fetchData();
  }, []);

  const handleRadioChange = useCallback(
    async (id: string, value: boolean) => {
      const original = originalItems.find((item) => item.id === id);
      if (!original || original.multiple_samples_present === value) return;

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, multiple_samples_present: value } : item,
        ),
      );

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/update-multiple-samples-present/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
              id,
              multiple_samples_present: value,
            }),
          },
        );

        setOriginalItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, multiple_samples_present: value }
              : item,
          ),
        );
      } catch (err) {
        console.error("Update failed", err);

        setItems(originalItems);
      }
    },
    [originalItems],
  );

  if (!authorized) return "Loading...";

  return (
    <>
      <Header />

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
              className="flex flex-col lg:flex-row items-start gap-4"
            >
              <div className="w-full lg:w-1/2">
                <div className="relative w-full h-124 overflow-hidden cursor-pointer flex items-center gap-2">
                  <span className="text-3xl font-bold"> {idx + 1}</span>
                  {item.picture ? (
                    <Image
                      src={item.picture}
                      alt="preview"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-124 flex items-center justify-center bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col justify-center mt-8 lg:mt-0">
                <div className="space-y-6">
                  <h2 className="text-6xl font-semibold">
                    A/B/C/D/E/F Present?
                  </h2>

                  <div className="flex gap-16 text-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-6xl">
                      <input
                        type="radio"
                        name={`sample-${item.id}`}
                        checked={item.multiple_samples_present === true}
                        onChange={() => handleRadioChange(item.id, true)}
                        className="w-12 h-12"
                      />
                      Yes
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-6xl">
                      <input
                        type="radio"
                        name={`sample-${item.id}`}
                        checked={item.multiple_samples_present === false}
                        onChange={() => handleRadioChange(item.id, false)}
                        className="w-12 h-12"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
