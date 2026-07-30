"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";

Chart.register(BarController, BarElement, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

export default function NetWorthChart({ targets, current }: { targets: number[]; current: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = targets.map((_, i) => `Yr ${i + 1}`);

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Target",
            data: targets,
            backgroundColor: "rgba(124,108,240,0.55)",
            borderRadius: 6,
            barThickness: 22,
            order: 2,
          },
          {
            type: "line",
            label: "Current net worth",
            data: labels.map(() => current),
            borderColor: "#2FBE7A",
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const v = item.parsed.y as number;
                const label = item.dataset.label || "";
                return `${label}: €${Math.round(v).toLocaleString("en-IE")}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "rgba(140,138,160,0.9)", font: { family: "JetBrains Mono", size: 10 } },
          },
          y: {
            grid: { color: "rgba(140,138,160,0.15)" },
            ticks: {
              color: "rgba(140,138,160,0.9)",
              font: { family: "JetBrains Mono", size: 10 },
              callback: (v) => "€" + Number(v).toLocaleString("en-IE"),
            },
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [targets, current]);

  return (
    <div style={{ height: 200, marginBottom: 8 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
