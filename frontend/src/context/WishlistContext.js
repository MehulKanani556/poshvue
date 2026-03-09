import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('userToken');

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlistItems([]);
      setWishlistCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await client.get('/wishlist');
      const items = res.data?.items || [];
      setWishlistItems(items);
      setWishlistCount(items.length);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      setWishlistItems([]);
      setWishlistCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    try {
      await client.post('/wishlist/toggle', { productId });
      await fetchWishlist(); // Refetch wishlist to update state
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      throw error;
    }
  };

  const value = {
    wishlistItems,
    wishlistCount,
    loading,
    fetchWishlist,
    toggleWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};