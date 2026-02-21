"use client";

import HourlyChart from "@/components/HourlyChart/HourlyChart";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [rawData, setRawData] = useState<any>(null);
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: [],
    datasets: [],
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [time, setTime] = useState(Date.now());
  const [firstLastScanData, setFirstLastScanData] = useState<any>([]);

  useEffect(() => {
    async function fetchReport() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/report/`);
      const apiData = await res.json();

      setRawData(apiData);

      const lastDate = new Date(
        apiData.time_periods[apiData.time_periods.length - 1].period_start,
      )
        .toISOString()
        .split("T")[0];

      setSelectedDate(lastDate);
    }

    fetchReport();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!rawData || !selectedDate) return;

    const { time_periods, users, report, first_last_scan } = rawData;

    const filteredPeriods = time_periods.filter((period: any) => {
      const date = new Date(period.period_start).toISOString().split("T")[0];
      return date === selectedDate;
    });

    const labels = filteredPeriods.map((period: any) => {
      const start = new Date(period.period_start);
      const end = new Date(period.period_end);

      const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      return `${formatTime(start)} - ${formatTime(end)}`;
    });

    const generateColor = (index: number) => {
      const colors = [
        "rgb(255, 159, 64)",
        "rgb(255, 99, 132)",
        "rgb(54, 162, 235)",
      ];
      return colors[index % colors.length];
    };

    const datasets = users.map((user: any, index: number) => {
      const userReport = report[user.username] || [];

      const filteredUserData = userReport
        .filter((entry: any) => {
          const entryDate = new Date(entry.period_start)
            .toISOString()
            .split("T")[0];
          return entryDate === selectedDate;
        })
        .map((entry: any) => entry.count);

      return {
        label: user.username,
        data: filteredUserData,
        borderColor: generateColor(index),
        backgroundColor: generateColor(index)
          .replace("rgb", "rgba")
          .replace(")", ", 0.2)"),
        fill: true,
        pointRadius: 4,
      };
    });

    setFirstLastScanData(first_last_scan);

    setChartData({ labels, datasets });
  }, [selectedDate, rawData]);

  const selectedDayData = useMemo(() => {
    if (!firstLastScanData) return [];

    return firstLastScanData.find((item: any) => item.date === selectedDate);
  }, [firstLastScanData, selectedDate]);

  const count = useMemo(() => {
    if (!rawData?.report || !selectedDate)
      return { user1Total: 0, user2Total: 0 };

    const { users, report } = rawData;

    const totals: Record<string, number> = {};

    users.map((user: any) => {
      const userReport = report[user.username] || [];

      const filteredTotal = userReport
        .filter((entry: any) => {
          const entryDate = new Date(entry.period_start)
            .toISOString()
            .split("T")[0];
          return entryDate === selectedDate;
        })
        .reduce((sum: number, item: any) => sum + item.count, 0);

      totals[user.username] = filteredTotal;
    });

    return totals;
  }, [rawData, selectedDate]);

  const expectedCount = useMemo(() => {
    const now = new Date();

    const start = new Date();
    start.setHours(9, 30, 0, 0);

    const end = new Date();
    end.setHours(18, 30, 0, 0);

    const lunchStart = new Date();
    lunchStart.setHours(13, 30, 0, 0);

    const lunchEnd = new Date();
    lunchEnd.setHours(14, 0, 0, 0);

    const tea1Start = new Date();
    tea1Start.setHours(11, 0, 0, 0);

    const tea1End = new Date(tea1Start.getTime() + 7.5 * 60 * 1000);

    const tea2Start = new Date();
    tea2Start.setHours(16, 0, 0, 0);

    const tea2End = new Date(tea2Start.getTime() + 7.5 * 60 * 1000);

    if (now < start) return 0;
    if (now > end) return 400;

    let workedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);

    const subtractBreak = (breakStart: Date, breakEnd: Date) => {
      if (now > breakStart) {
        const breakTime =
          Math.min(now.getTime(), breakEnd.getTime()) - breakStart.getTime();
        workedMinutes -= breakTime / (1000 * 60);
      }
    };

    subtractBreak(lunchStart, lunchEnd);
    subtractBreak(tea1Start, tea1End);
    subtractBreak(tea2Start, tea2End);

    const totalWorkingMinutes = 495;
    const ratePerMinute = 400 / totalWorkingMinutes;

    return Math.max(0, Math.round(workedMinutes * ratePerMinute));
  }, [time]);

  if (!rawData) return <div>Loading...</div>;

  const availableDates = [
    ...new Set(
      rawData.time_periods.map(
        (period: any) =>
          new Date(period.period_start).toISOString().split("T")[0],
      ),
    ),
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto bg-white p-3 md:p-6 rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-4 px-1">
            Hourly Data Chart
          </h2>

          <div className="mb-4">
            <label className="mr-2 font-medium">Select Date:</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border px-3 py-1 rounded"
            >
              {availableDates.map((date: any) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          {selectedDayData ? (
            <div className="flex justify-between bg-gray-200 rounded p-4 mb-4">
              {selectedDayData.user_data.map((user: any) => (
                <div key={user.user_id}>
                  <h3 className="font-semibold capitalize">{user.username}</h3>
                  <p>
                    First Scan:{" "}
                    {new Date(user.first_scan).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>

                  <p>
                    Last Scan:{" "}
                    {new Date(user.last_scan).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No data for selected date</p>
          )}

          <div className="flex justify-between w-full text-xl mb-4">
            {rawData.users.map((user: any) => (
              <div key={user.username}>
                <span className="capitalize font-bold">{user.username}</span>:{" "}
                {count[user.username] ?? 0}
              </div>
            ))}
          </div>

          <div className="mb-8">
            <span className="font-bold text-xl">Expected by now:</span>{" "}
            {expectedCount} / 400
          </div>

          <HourlyChart chartData={chartData} />
        </div>
      </div>
      <Footer />
    </>
  );
}
