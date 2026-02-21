import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function HourlyChart({ chartData }: any) {
  const MIN_WIDTH = 600;        
  const WIDTH_PER_LABEL = 80; 

  const calculatedWidth = Math.max(
    MIN_WIDTH,
    chartData.labels.length * WIDTH_PER_LABEL
  );

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: true },
    },
    pointBorderWidth: 10,
    scales: {
      y: {
        min: 0,
        ticks: { stepSize: 5 },
      },
      x: {
        ticks: {
        autoSkip: false,   
        maxRotation: 90,
        minRotation: 45,
      },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "760px", overflowX: "auto" }}>
      <div style={{ minWidth: `${calculatedWidth}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
