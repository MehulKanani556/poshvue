import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import client from "../api/client";

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshCountries = useCallback(async () => {
    try {
      const res = await client.get("/country/active");
      const countriesList = res.data?.items || [];
      setCountries(countriesList);
      return countriesList;
    } catch (err) {
      console.error("Failed to refresh countries:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const res = await client.get("/country/active");
        const countriesList = res.data?.items || [];
        setCountries(countriesList);

        const savedCountryCode = localStorage.getItem("selectedCountryCode");
        let countryToSet = null;

        if (savedCountryCode) {
          countryToSet = countriesList.find((c) => c.code === savedCountryCode);
        }

        if (!countryToSet) {
          try {
            const defaultRes = await client.get("/country/default");
            countryToSet = defaultRes.data?.item;
          } catch (err) {
            countryToSet = countriesList[0] || null;
          }
        }

        if (countryToSet) {
          setSelectedCountry(countryToSet);
          localStorage.setItem("selectedCountryCode", countryToSet.code);
        }
      } catch (err) {
        console.error("Failed to load countries:", err);
        setSelectedCountry({
          name: "India",
          code: "IN",
          currency: "INR",
          currencySymbol: "₹",
          exchangeRate: 1,
        });
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
    const refreshInterval = setInterval(() => refreshCountries(), 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [refreshCountries]);

  const selectCountry = async (country) => {
    try {
      const countryId = country._id || country.id;
      if (!countryId) {
        const fallbackCountry = { ...country };
        setSelectedCountry(fallbackCountry);
        localStorage.setItem("selectedCountryCode", fallbackCountry.code);
        window.dispatchEvent(new CustomEvent("countryChanged", { detail: fallbackCountry }));
        return;
      }

      try {
        await client.post("/country/set-default", { countryId });
      } catch (err) {
        console.error("Backend set-default error:", err);
      }

      const updatedCountries = await refreshCountries();
      const latestCountry = updatedCountries.find(
        (c) => String(c._id) === String(countryId) || c.code === country.code
      ) || country;

      const updatedCountry = { ...latestCountry, isDefault: true };
      setSelectedCountry(updatedCountry);
      localStorage.setItem("selectedCountryCode", updatedCountry.code);
      window.dispatchEvent(new CustomEvent("countryChanged", { detail: updatedCountry }));
    } catch (err) {
      console.error("Failed to select country:", err);
      const fallbackCountry = { ...country };
      setSelectedCountry(fallbackCountry);
      localStorage.setItem("selectedCountryCode", fallbackCountry.code);
      window.dispatchEvent(new CustomEvent("countryChanged", { detail: fallbackCountry }));
    }
  };

  const formatPrice = useCallback((price) => {
    if (!selectedCountry || price === null || price === undefined || price === "") {
      return "—";
    }
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price);
    const convertedPrice = n * (selectedCountry.exchangeRate || 1);
    const formatted = convertedPrice.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${selectedCountry.currencySymbol}${formatted}`;
  }, [selectedCountry]);

  const getConvertedPrice = useCallback((price) => {
    if (!selectedCountry || price === null || price === undefined) return 0;
    const n = Number(price);
    if (!Number.isFinite(n)) return 0;
    return n * (selectedCountry.exchangeRate || 1);
  }, [selectedCountry]);

  const value = {
    selectedCountry,
    countries,
    selectCountry,
    refreshCountries,
    formatPrice,
    getConvertedPrice,
    loading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
