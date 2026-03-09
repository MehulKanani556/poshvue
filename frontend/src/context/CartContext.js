import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('userToken');

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      setCartCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await client.get('/cart');
      const items = res.data?.items || [];
      setCartItems(items);
      setCartCount(items.length);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setCartItems([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (product) => {
    try {
      await client.post('/cart/add', product);
      await fetchCart(); // Refetch cart to update state
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await client.delete(`/cart/remove/${productId}`);
      await fetchCart(); // Refetch cart to update state
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const updateQty = async (item, quantity) => {
    try {
      await client.put('/cart/update', { ...item, qty: quantity });
      await fetchCart(); // Refetch cart to update state
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const value = {
    cartItems,
    cartCount,
    loading,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQty,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};