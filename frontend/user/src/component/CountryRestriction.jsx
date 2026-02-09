import React, { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import client from "../api/client";
import Loader from "./Loader";

const CountryRestriction = ({ children }) => {
  const { selectedCountry, countries } = useCurrency();
  const [isAllowed, setIsAllowed] = useState(null); // null = checking, true = allowed, false = blocked
  const [userCountry, setUserCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detect user's country
  const detectUserCountry = async () => {
    try {
      // Method 1: Try using IP geolocation API (free service - ipapi.co)
      try {
        const response = await fetch("https://ipapi.co/json/", {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            console.log("🌍 Detected country via ipapi.co:", data.country_code);
            return data.country_code.toUpperCase();
          }
        }
      } catch (err) {
        console.warn("ipapi.co failed, trying alternative:", err);
      }

      // Method 2: Try alternative IP service (ip-api.com)
      try {
        const response = await fetch("https://ip-api.com/json/", {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.countryCode) {
            console.log("🌍 Detected country via ip-api.com:", data.countryCode);
            return data.countryCode.toUpperCase();
          }
        }
      } catch (err) {
        console.warn("ip-api.com failed:", err);
      }

      // Method 3: Try geojs.io
      try {
        const response = await fetch("https://get.geojs.io/v1/ip/country.json");
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            console.log("🌍 Detected country via geojs.io:", data.country);
            return data.country.toUpperCase();
          }
        }
      } catch (err) {
        console.warn("geojs.io failed:", err);
      }

      return null;
    } catch (error) {
      console.error("Error detecting country:", error);
      return null;
    }
  };

  // Check if user's country is allowed
  useEffect(() => {
    const checkCountryAccess = async () => {
      try {
        setLoading(true);
        console.log("🔒 Starting country access check...");
        
        // Get active countries from backend
        let activeCountries = countries;
        if (!activeCountries || activeCountries.length === 0) {
          try {
            console.log("📡 Fetching active countries from backend...");
            const res = await client.get("/country/active");
            activeCountries = res.data?.items || [];
            console.log("✅ Active countries fetched:", activeCountries.length);
          } catch (err) {
            console.error("❌ Error fetching active countries:", err);
            // If we can't fetch countries, allow access (fail open)
            setIsAllowed(true);
            setLoading(false);
            return;
          }
        }

        // If no active countries, allow access (no restriction configured)
        if (activeCountries.length === 0) {
          console.log("⚠️ No active countries found, allowing access");
          setIsAllowed(true);
          setLoading(false);
          return;
        }

        console.log("🌍 Active countries:", activeCountries.map(c => c.code).join(", "));

        // Detect user's country
        const detectedCountryCode = await detectUserCountry();
        setUserCountry(detectedCountryCode);

        // Check if detected country is in the allowed list
        if (detectedCountryCode) {
          const isCountryAllowed = activeCountries.some(
            (country) => country.code === detectedCountryCode && country.active !== false
          );
          console.log(`🔍 Country ${detectedCountryCode} is ${isCountryAllowed ? 'ALLOWED' : 'BLOCKED'}`);
          setIsAllowed(isCountryAllowed);
        } else {
          // If we can't detect country, check if selected country is allowed
          if (selectedCountry) {
            console.log("🔍 Using selected country as fallback:", selectedCountry.code);
            const isSelectedAllowed = activeCountries.some(
              (country) => country.code === selectedCountry.code && country.active !== false
            );
            console.log(`🔍 Selected country ${selectedCountry.code} is ${isSelectedAllowed ? 'ALLOWED' : 'BLOCKED'}`);
            setIsAllowed(isSelectedAllowed);
          } else {
            // If we can't detect and no selected country, allow access (fail open)
            console.log("⚠️ Cannot detect country and no selected country, allowing access");
            setIsAllowed(true);
          }
        }
      } catch (error) {
        console.error("❌ Error checking country access:", error);
        // On error, allow access (fail open)
        setIsAllowed(true);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for CurrencyContext to load countries
    const timer = setTimeout(() => {
      checkCountryAccess();
    }, 1000);

    return () => clearTimeout(timer);
  }, [countries, selectedCountry]);

  // Show loader while checking
  if (loading || isAllowed === null) {
    return <Loader fullScreen text="Checking access..." />;
  }

  // Block access if country is not allowed
  if (!isAllowed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#7fb0df1f",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              marginBottom: "20px",
            }}
          >
            🚫
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: "#333",
            }}
          >
            Access Restricted
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#666",
              marginBottom: "20px",
              lineHeight: "1.6",
            }}
          >
            We're sorry, but our services are currently not available in your
            country.
          </p>
          {userCountry && (
            <p
              style={{
                fontSize: "14px",
                color: "#999",
                marginTop: "10px",
              }}
            >
              Detected Country: {userCountry}
            </p>
          )}
          <div
            style={{
              marginTop: "30px",
              padding: "15px",
              backgroundColor: "#7fb0df1f",
              borderRadius: "5px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                margin: 0,
              }}
            >
              If you believe this is an error, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Allow access
  return <>{children}</>;
};

export default CountryRestriction;
