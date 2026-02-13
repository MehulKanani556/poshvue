// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.poshwue.com/api';

export const API_ENDPOINTS = {
  // Cart endpoints
  CART: `${API_BASE_URL}/cart`,
  CART_UPDATE: `${API_BASE_URL}/cart/update`,
  
  // Product endpoints
  CATEGORIES: `${API_BASE_URL}/catalog/categories`,
  
  // Support endpoints
  NEWSLETTER_SUBSCRIBE: `${API_BASE_URL}/support/subscriptions`,
  
  // Commerce endpoints
  COUPONS_ACTIVE: `${API_BASE_URL}/commerce/coupons/active`,
};

export default API_BASE_URL;
