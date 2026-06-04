import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers, PriceScaleMode } from "lightweight-charts";
import { MousePointer2, Minus, TrendingUp, Trash2, Layers, Activity, Volume2 } from "lucide-react";

export default function TradingViewChart({ data, positive, aiPatterns = [], compareData = [] }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef({ candlestick: null, volume: null, sma: null, markersPlugin: null, compareSeries: [] });

  const [activeTool, setActiveTool] = useState("cursor"); // 'cursor', 'horizontal', 'trendline', 'fibonacci'
  const [showSMA, setShowSMA] = useState(false);
  const [showVP, setShowVP] = useState(false);
  const [vpBins, setVpBins] = useState([]);
  const activeToolRef = useRef(activeTool);

  const drawState = useRef({
    step: 0,
    p1: null,
    tempSeries: null,
    trendlines: [],
    priceLines: [],
    cachedSMA: [],
  });

  useEffect(() => {
    activeToolRef.current = activeTool;
    // Cancel mid-draw tools if tool changes
    if (activeTool !== "trendline" && activeTool !== "fibonacci" && drawState.current.step === 1) {
      if (drawState.current.tempSeries && chartRef.current) {
        chartRef.current.removeSeries(drawState.current.tempSeries);
      }
      drawState.current.step = 0;
      drawState.current.p1 = null;
      drawState.current.tempSeries = null;
    }
  }, [activeTool]);

  useEffect(() => {
    if (seriesRef.current.sma && drawState.current.cachedSMA) {
      seriesRef.current.sma.setData(showSMA ? drawState.current.cachedSMA : []);
    }
  }, [showSMA]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94A3B8", // text-eli-muted
      },
      grid: {
        vertLines: { color: "#1E3A5F", style: 1 }, // dashed
        horzLines: { color: "#1E3A5F", style: 1 },
      },
      crosshair: {
        mode: 1, // Normal
      },
      rightPriceScale: {
        borderColor: "#1E3A5F",
      },
      timeScale: {
        borderColor: "#1E3A5F",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981", // emerald-500
      downColor: "#EF4444", // red-500
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
    });

    const smaSeries = chart.addSeries(LineSeries, {
      color: "#F59E0B", // amber-500
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#1E3A5F",
      priceFormat: { type: "volume" },
      priceScaleId: "", // Set as an overlay
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Push volume down to the bottom 20%
        bottom: 0,
      },
    });

    chartRef.current = chart;
    seriesRef.current = { candlestick: candlestickSeries, volume: volumeSeries, sma: smaSeries };

    // --- Drawing Tools Logic ---
    const clickHandler = (param) => {
      if (!param.point || !param.time) return;
      const price = candlestickSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (activeToolRef.current === "horizontal") {
        const line = candlestickSeries.createPriceLine({
          price: price,
          color: "#FCD34D", // Amber-300
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: "S/R",
        });
        drawState.current.priceLines.push(line);
        setActiveTool("cursor");
      } else if (activeToolRef.current === "trendline") {
        if (drawState.current.step === 0) {
          drawState.current.p1 = { time: param.time, value: price };
          drawState.current.step = 1;

          const temp = chart.addSeries(LineSeries, {
            color: "#38BDF8", // Sky-400
            lineWidth: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          drawState.current.tempSeries = temp;
        } else if (drawState.current.step === 1) {
          const p2 = { time: param.time, value: price };
          const p1 = drawState.current.p1;
          const lineData = p1.time < p2.time ? [p1, p2] : [p2, p1];
          drawState.current.tempSeries.setData(lineData);

          drawState.current.trendlines.push(drawState.current.tempSeries);

          drawState.current.step = 0;
          drawState.current.p1 = null;
          drawState.current.tempSeries = null;
          setActiveTool("cursor");
        }
      } else if (activeToolRef.current === "fibonacci") {
        if (drawState.current.step === 0) {
          drawState.current.p1 = { time: param.time, value: price };
          drawState.current.step = 1;
        } else if (drawState.current.step === 1) {
          const p2 = { time: param.time, value: price };
          const p1 = drawState.current.p1;

          const diff = p2.value - p1.value;
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          const colors = ["#94A3B8", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#94A3B8"];

          levels.forEach((level, i) => {
            const linePrice = p1.value + (diff * level);
            const line = candlestickSeries.createPriceLine({
              price: linePrice,
              color: colors[i],
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: `Fib ${level}`,
            });
            drawState.current.priceLines.push(line);
          });

          drawState.current.step = 0;
          drawState.current.p1 = null;
          setActiveTool("cursor");
        }
      }
    };

    const moveHandler = (param) => {
      if (activeToolRef.current === "trendline" && drawState.current.step === 1) {
        if (!param.point || !param.time) return;
        const price = candlestickSeries.coordinateToPrice(param.point.y);
        if (price === null) return;

        const p1 = drawState.current.p1;
        const p2 = { time: param.time, value: price };
        const lineData = p1.time < p2.time ? [p1, p2] : [p2, p1];

        if (drawState.current.tempSeries) {
          drawState.current.tempSeries.setData(lineData);
        }
      }
    };

    chart.subscribeClick(clickHandler);
    chart.subscribeCrosshairMove(moveHandler);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.unsubscribeClick(clickHandler);
      chart.unsubscribeCrosshairMove(moveHandler);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current.candlestick || !data || data.length === 0) return;

    // lightweight-charts requires strictly ascending times and unique times
    const formattedData = [...data]
      .map((c) => ({
        time: Math.floor(new Date(c.time).getTime() / 1000), // convert to unix timestamp
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }))
      .sort((a, b) => a.time - b.time);

    const uniqueCandles = [];
    const uniqueVolumes = [];
    const times = new Set();

    formattedData.forEach((d) => {
      if (!times.has(d.time)) {
        times.add(d.time);
        uniqueCandles.push({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        });
        uniqueVolumes.push({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
        });
      }
    });

    seriesRef.current.candlestick.setData(uniqueCandles);
    seriesRef.current.volume.setData(uniqueVolumes);

    // Calculate Actual AI Pattern Markers (MVP Scanning Engine)
    const markers = [];
    if (uniqueCandles.length > 2) {
      for (let i = 2; i < uniqueCandles.length; i++) {
        const curr = uniqueCandles[i];
        const prev = uniqueCandles[i - 1];

        const currBody = Math.abs(curr.close - curr.open);
        const prevBody = Math.abs(prev.close - prev.open);
        const currRange = curr.high - curr.low;

        const isCurrBullish = curr.close > curr.open;
        const isPrevBullish = prev.close > prev.open;

        // Bullish Engulfing
        if (!isPrevBullish && isCurrBullish && curr.close > prev.open && curr.open < prev.close) {
          const prob = Math.min(99, Math.floor(70 + (currBody / prevBody) * 10)); // Dynamic probability based on relative size
          markers.push({
            time: curr.time,
            position: "belowBar",
            color: "#10B981",
            shape: "arrowUp",
            text: `Bullish Engulfing (${prob}%)`,
          });
        }
        // Bearish Engulfing
        else if (isPrevBullish && !isCurrBullish && curr.close < prev.open && curr.open > prev.close) {
          const prob = Math.min(99, Math.floor(70 + (currBody / prevBody) * 10));
          markers.push({
            time: curr.time,
            position: "aboveBar",
            color: "#EF4444",
            shape: "arrowDown",
            text: `Bearish Engulfing (${prob}%)`,
          });
        }
        // Hammer
        else if (currRange > 0) {
          const lowerWick = isCurrBullish ? curr.open - curr.low : curr.close - curr.low;
          const upperWick = isCurrBullish ? curr.high - curr.close : curr.high - curr.open;

          if (lowerWick > currBody * 2 && upperWick < currBody * 0.5) {
            const prob = Math.min(99, Math.floor(60 + (lowerWick / currRange) * 30));
            markers.push({
              time: curr.time,
              position: "belowBar",
              color: "#3B82F6", // Blue for hammer
              shape: "arrowUp",
              text: `Hammer (${prob}%)`,
            });
          }
        }
      }
    }

    if (!seriesRef.current.markersPlugin) {
      seriesRef.current.markersPlugin = createSeriesMarkers(seriesRef.current.candlestick, markers);
    } else {
      seriesRef.current.markersPlugin.setMarkers(markers);
    }

    // Handle Comparison Mode
    const isComparing = compareData && compareData.length > 0;
    chartRef.current.applyOptions({
      rightPriceScale: {
        mode: isComparing ? PriceScaleMode.Percentage : PriceScaleMode.Normal,
      }
    });

    if (seriesRef.current.compareSeries) {
      seriesRef.current.compareSeries.forEach(s => chartRef.current.removeSeries(s));
    }
    seriesRef.current.compareSeries = [];

    const colors = ["#38BDF8", "#F472B6", "#A78BFA"]; // Sky, Pink, Purple
    if (isComparing) {
      compareData.forEach((cd, i) => {
        const line = chartRef.current.addSeries(LineSeries, {
          color: colors[i % colors.length],
          lineWidth: 2,
          priceScaleId: 'right',
        });

        const fData = cd.data.map(c => ({
          time: Math.floor(new Date(c.timestamp).getTime() / 1000),
          value: c.close
        })).sort((a, b) => a.time - b.time);

        const uData = [];
        const tSet = new Set();
        fData.forEach(d => {
          if (!tSet.has(d.time)) {
            tSet.add(d.time);
            uData.push(d);
          }
        });
        line.setData(uData);
        seriesRef.current.compareSeries.push(line);
      });
    }

    // Calculate MVP Technical Overlay (SMA 20)
    const smaData = [];
    const period = 20;
    for (let i = 0; i < uniqueCandles.length; i++) {
      if (i < period - 1) continue;
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += uniqueCandles[i - j].close;
      }
      smaData.push({ time: uniqueCandles[i].time, value: sum / period });
    }
    drawState.current.cachedSMA = smaData;
    if (showSMA) {
      seriesRef.current.sma.setData(smaData);
    } else {
      seriesRef.current.sma.setData([]);
    }

    chartRef.current.timeScale().fitContent();
  }, [data, showSMA, compareData, aiPatterns]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current.candlestick) return;

    const updateVP = () => {
      if (!chartRef.current || !seriesRef.current.candlestick) return;
      const logicalRange = chartRef.current.timeScale().getVisibleLogicalRange();
      if (!logicalRange) return;

      const data = seriesRef.current.candlestick.data();
      const fromIdx = Math.max(0, Math.floor(logicalRange.from));
      const toIdx = Math.min(data.length - 1, Math.ceil(logicalRange.to));

      const visibleData = data.slice(fromIdx, toIdx + 1);
      if (visibleData.length === 0) return;

      let minP = Infinity;
      let maxP = -Infinity;
      visibleData.forEach(d => {
        if (d.low < minP) minP = d.low;
        if (d.high > maxP) maxP = d.high;
      });

      const binsCount = 24;
      const binSize = (maxP - minP) / binsCount;
      if (binSize <= 0) return;

      const bins = Array(binsCount).fill(0);
      visibleData.forEach(d => {
        const binIdx = Math.floor((d.close - minP) / binSize);
        const i = Math.min(binsCount - 1, Math.max(0, binIdx));
        bins[i] += d.volume || 1;
      });

      const maxVol = Math.max(...bins, 1);
      const newBins = bins.map((vol, i) => {
        const priceTop = maxP - (i * binSize);
        const priceBottom = maxP - ((i + 1) * binSize);
        const yTop = seriesRef.current.candlestick.priceToCoordinate(priceTop);
        const yBottom = seriesRef.current.candlestick.priceToCoordinate(priceBottom);

        if (yTop === null || yBottom === null) return null;

        return {
          top: Math.min(yTop, yBottom),
          height: Math.abs(yBottom - yTop),
          volume: vol,
          maxVol
        };
      }).filter(Boolean);

      setVpBins(newBins);
    };

    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(updateVP);
    setTimeout(updateVP, 100);

    return () => {
      if (chartRef.current) {
        chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(updateVP);
      }
    };
  }, [data, compareData]);

  const clearDrawings = () => {
    if (!seriesRef.current.candlestick || !chartRef.current) return;

    drawState.current.priceLines.forEach((l) =>
      seriesRef.current.candlestick.removePriceLine(l)
    );
    drawState.current.priceLines = [];

    drawState.current.trendlines.forEach((s) => chartRef.current.removeSeries(s));
    drawState.current.trendlines = [];
  };

  const ToolButton = ({ tool, icon: Icon, title, onClick }) => {
    const isActive = activeTool === tool;
    return (
      <button
        onClick={onClick || (() => setActiveTool(tool))}
        title={title}
        className={`p-2 rounded-sm transition-colors ${isActive
          ? "bg-eli-gold text-eli-navy"
          : "text-eli-muted hover:bg-eli-border/50 hover:text-eli-text-white"
          }`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="relative w-full h-full group">
      {/* Drawing Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 bg-[#0F172A]/90 backdrop-blur-sm border border-[#1E3A5F] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ToolButton tool="cursor" icon={MousePointer2} title="Cursor" />
        <ToolButton tool="horizontal" icon={Minus} title="Support / Resistance" />
        <ToolButton tool="trendline" icon={TrendingUp} title="Trendline" />
        <ToolButton tool="fibonacci" icon={Layers} title="Fibonacci Retracement" />

        <div className="w-full h-px bg-[#1E3A5F] my-1" />

        <button
          onClick={() => setShowSMA(!showSMA)}
          title="Toggle SMA Overlay"
          className={`p-2 rounded-sm transition-colors ${showSMA ? "bg-eli-gold text-eli-navy" : "text-eli-muted hover:bg-eli-border/50 hover:text-eli-text-white"}`}
        >
          <Activity className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowVP(!showVP)}
          title="Toggle Volume Profile"
          className={`p-2 rounded-sm transition-colors ${showVP ? "bg-eli-gold text-eli-navy" : "text-eli-muted hover:bg-eli-border/50 hover:text-eli-text-white"}`}
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <div className="w-full h-px bg-[#1E3A5F] my-1" />

        <button
          onClick={clearDrawings}
          title="Clear Drawings"
          className="p-2 text-eli-muted hover:bg-red-500/20 hover:text-red-400 rounded-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-full relative" />

      {/* Volume Profile Overlay */}
      {showVP && vpBins.length > 0 && (
        <div className="absolute top-0 right-14 bottom-6 w-32 pointer-events-none flex flex-col z-10">
          {vpBins.map((b, i) => (
            <div
              key={i}
              className="absolute right-0 bg-[#38BDF8] opacity-10"
              style={{ top: b.top, height: Math.max(b.height, 1), width: `${(b.volume / b.maxVol) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
