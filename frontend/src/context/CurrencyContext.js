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



  const detectCountryByLocation = async () => {

    try {

      const response = await fetch('https://ipapi.co/json/');

      const data = await response.json();

      return data.country_code || data.country || null;

    } catch (error) {

      console.error('Failed to detect country by location:', error);

      try {

        const fallbackResponse = await fetch('https://ipinfo.io/json');

        const fallbackData = await fallbackResponse.json();

        return fallbackData.country || null;

      } catch (fallbackError) {

        console.error('Fallback location detection failed:', fallbackError);

        return null;

      }

    }

  };



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



        // Auto-detect country by location (no manual selection)
        let countryToSet = null;

        // Always try to detect country by location first
        const detectedCountryCode = await detectCountryByLocation();
        if (detectedCountryCode) {
          countryToSet = countriesList.find((c) => c.code === detectedCountryCode);
        }

        // If detection fails, try default country from backend
        if (!countryToSet) {
          try {
            const defaultRes = await client.get("/country/default");
            countryToSet = defaultRes.data?.item;
          } catch (err) {
            // If backend default fails, use first active country
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



  // Manual country selection disabled - auto-detect by location only
  const selectCountry = async (country) => {
    console.log("Manual country selection is disabled. Using auto-detection by location.");
    // Do nothing - country is set automatically by location detection
  };



  const formatPrice = useCallback((product, priceType = 'salePrice') => {

    if (!selectedCountry || !product) return "—";

    

    // Check if product has pricesByCountry array

    if (product.pricesByCountry && Array.isArray(product.pricesByCountry)) {

      // Find price for selected country

      const countryPrice = product.pricesByCountry.find(

        price => price.country && (

          price.country._id === selectedCountry._id || 

          price.country === selectedCountry._id ||

          price.country === selectedCountry.code

        )

      );

      

      if (countryPrice) {

        const price = countryPrice[priceType] || countryPrice.price || countryPrice.salePrice;

        if (price !== null && price !== undefined) {

          const n = Number(price);

          if (!Number.isFinite(n)) return String(price);

          const formatted = n.toLocaleString("en-IN", {

            minimumFractionDigits: 0,

            maximumFractionDigits: 0,

          });

          return `${selectedCountry.currencySymbol}${formatted}`;

        }

      }

    }

    

    // Fallback to original price with exchange rate conversion

    const price = product[priceType] || product.price;

    if (price === null || price === undefined || price === "") {

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



  const getConvertedPrice = useCallback((product, priceType = 'salePrice') => {

    if (!selectedCountry || !product) return 0;

    

    // Check if product has pricesByCountry array

    if (product.pricesByCountry && Array.isArray(product.pricesByCountry)) {

      const countryPrice = product.pricesByCountry.find(

        price => price.country && (

          price.country._id === selectedCountry._id || 

          price.country === selectedCountry._id ||

          price.country === selectedCountry.code

        )

      );

      

      if (countryPrice) {

        const price = countryPrice[priceType] || countryPrice.price || countryPrice.salePrice;

        if (price !== null && price !== undefined) {

          return Number(price);

        }

      }

    }

    

    // Fallback to original price with exchange rate conversion

    const price = product[priceType] || product.price;

    if (price === null || price === undefined) return 0;

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

