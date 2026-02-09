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

  // Refresh countries list from backend
  const refreshCountries = useCallback(async () => {
    try {
      const res = await client.get("/country/active");
      const countriesList = res.data?.items || [];
      setCountries(countriesList);
      return countriesList;
    } catch (err) {
      console.error("Failed to refresh countries:", err);
      // Return empty array on error, selectCountry will handle fallback
      return [];
    }
  }, []);

  // Load countries and set default
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        console.log("🔄 Loading countries...");
        
        // Fetch active countries
        const res = await client.get("/country/active");
        const countriesList = res.data?.items || [];
        console.log("📋 Countries loaded:", countriesList.length, "countries");
        setCountries(countriesList);

        // Get saved country from localStorage or fetch default
        const savedCountryCode = localStorage.getItem("selectedCountryCode");
        let countryToSet = null;

        console.log("💾 Saved country code:", savedCountryCode);

        if (savedCountryCode) {
          countryToSet = countriesList.find((c) => c.code === savedCountryCode);
          console.log("🔍 Found saved country:", countryToSet);
        }

        if (!countryToSet) {
          // Fetch default country
          console.log("🔄 Fetching default country...");
          try {
            const defaultRes = await client.get("/country/default");
            countryToSet = defaultRes.data?.item;
            console.log("✅ Default country fetched:", countryToSet);
          } catch (err) {
            console.log("⚠️ No default country, using first active");
            // If no default, use first active country
            countryToSet = countriesList[0] || null;
          }
        }

        if (countryToSet) {
          console.log("✅ Setting selected country:", countryToSet.name);
          setSelectedCountry(countryToSet);
          localStorage.setItem("selectedCountryCode", countryToSet.code);
        }
      } catch (err) {
        console.error("❌ Failed to load countries:", err);
        // Fallback to default values
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
    
    // Refresh countries list periodically to get latest backend updates
    const refreshInterval = setInterval(() => {
      refreshCountries();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [refreshCountries]);

  // User country selection - sets country as default in backend and updates local state
  const selectCountry = async (country) => {
    console.log("🔄 selectCountry called with:", country);
    console.log("🌐 Making API call to:", client.defaults.baseURL + "/country/set-default");
    
    try {
      // Get country ID - handle both _id and id formats
      const countryId = country._id || country.id;
      
      console.log("📋 Country ID extracted:", countryId);
      
      if (!countryId) {
        console.error("❌ Country ID not found in country object:", country);
        // Still update local state even if backend call fails
        const fallbackCountry = { ...country };
        setSelectedCountry(fallbackCountry);
        localStorage.setItem("selectedCountryCode", fallbackCountry.code);
        window.dispatchEvent(new CustomEvent('countryChanged', { detail: fallbackCountry }));
        return;
      }

      // Step 1: Set country as default in backend (isDefault: true for selected, false for others)
      console.log("🌐 Calling backend API: POST /country/set-default with countryId:", countryId);
      
      try {
        const response = await client.post("/country/set-default", { countryId });
        console.log("✅ Backend API Response:", response.data);
        
        if (response.data?.item) {
          console.log("✅ Country set as default successfully:", response.data.item.name, "isDefault:", response.data.item.isDefault);
        }
      } catch (err) {
        console.error("❌ Backend API Error:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          url: err.config?.url,
          method: err.config?.method
        });
        // Continue with local update even if backend call fails
      }

      // Step 2: Refresh countries list to get latest data (including updated isDefault status)
      const updatedCountries = await refreshCountries();
      
      // Step 3: Find the selected country from updated list to get latest backend data
      const latestCountry = updatedCountries.find(
        (c) => String(c._id) === String(countryId) || c.code === country.code
      ) || country;
      
      // Step 4: Update selected country with latest backend data
      // Create new object reference to force React re-render
      const updatedCountry = { ...latestCountry, isDefault: true };
      setSelectedCountry(updatedCountry);
      localStorage.setItem("selectedCountryCode", updatedCountry.code);
      
      // Step 5: Dispatch custom event to notify components about country change
      window.dispatchEvent(new CustomEvent('countryChanged', { detail: updatedCountry }));
    } catch (err) {
      console.error("Failed to select country:", err);
      // Fallback to provided country if API fails
      const fallbackCountry = { ...country };
      setSelectedCountry(fallbackCountry);
      localStorage.setItem("selectedCountryCode", fallbackCountry.code);
      window.dispatchEvent(new CustomEvent('countryChanged', { detail: fallbackCountry }));
    }
  };

  // Format price with currency - wrapped in useCallback to trigger re-renders when selectedCountry changes
  const formatPrice = useCallback((price) => {
    if (!selectedCountry || price === null || price === undefined || price === "") {
      return "—";
    }
    const n = Number(price);
    if (!Number.isFinite(n)) return String(price);

    // Apply exchange rate
    const convertedPrice = n * (selectedCountry.exchangeRate || 1);
    
    // Format number with locale
    const formatted = convertedPrice.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return `${selectedCountry.currencySymbol}${formatted}`;
  }, [selectedCountry]);

  // Get converted price value (for calculations)
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
