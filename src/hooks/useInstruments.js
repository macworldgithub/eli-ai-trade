import { useState, useEffect } from "react";
import { marketAPI } from "../lib/api";

/**
 * Custom hook to load instrument data from the market API.
 * Returns the list of instruments and a loading state.
 */
export default function useInstruments() {
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketAPI
      .getAllMarketData()
      .then((r) => {
        setInstruments(r.data.instruments || []);
      })
      .catch(() => {
        setInstruments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { instruments, loading };
}
