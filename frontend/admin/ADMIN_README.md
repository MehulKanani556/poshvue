# PoshVue Admin Panel

A fully responsive, mobile-first admin dashboard for managing e-commerce operations.

## Features

### ✅ Authentication
- Login/Logout functionality
- Session management with localStorage
- Protected routes

### 📊 Dashboard
- Real-time statistics cards
- Recent orders overview
- Top products display
- Revenue tracking

### 📁 Category Management (CRUD)
- Create new categories
- View all categories
- Edit category details
- Delete categories
- Status management (Active/Inactive)

### 📦 Product Management (CRUD)
- Add new products
- View product inventory
- Edit product details
- Delete products
- Stock management
- Category assignment
- Pricing management

### 📋 Order Management
- View all orders
- Order status tracking
- Customer information
- Order filtering and search
- Track individual orders with detailed timeline

### 🎟️ Coupon Management (CRUD)
- Create discount coupons
- Set percentage or fixed discounts
- Track coupon usage
- Expiry date management
- Status management (Active/Inactive/Expired)

### 👥 User Management
- View all registered users
- User search and filtering
- Contact information display
- User activity metrics
- Status tracking

### 📈 Reports
- Daily sales reports
- Category-wise sales analysis
- Revenue tracking
- Export options (PDF, CSV, Excel)
- Performance metrics

## Responsive Design

The admin panel is fully responsive with mobile-first approach:

- **Desktop**: Full sidebar navigation, multi-column grids
- **Tablets (768px)**: Optimized layouts, reduced sidebar width
- **Mobile (576px)**: Collapsible sidebar, stacked layouts
- **Small Mobile (320px)**: Minimal design, simplified interface

All pages adapt gracefully to screen sizes from 320px and up.

## Technologies Used

- React 19.2.3
- React Router DOM 7.11.0
- React Icons 5.5.0
- Bootstrap 5.3.8
- Axios 1.13.2
- CSS (Custom x_ classes for consistent styling)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Navigate to the admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The admin panel will open at `http://localhost:3000`

## Demo Credentials

```
Email: admin@poshvue.com
Password: admin123
```

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Layout.js          # Main layout with sidebar and header
│   │   ├── ProtectedRoute.js  # Route protection component
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── Login.js       # Login page
│   │   ├── Dashboard.js       # Main dashboard
│   │   ├── Categories/
│   │   │   └── Categories.js  # Category management
│   │   ├── Products/
│   │   │   └── Products.js    # Product management
│   │   ├── Orders/
│   │   │   ├── Orders.js      # Orders listing
│   │   │   └── TrackOrder.js  # Order tracking
│   │   ├── Coupons/
│   │   │   └── Coupons.js     # Coupon management
│   │   ├── Users/
│   │   │   └── Users.js       # Users management
│   │   └── Reports/
│   │       └── Reports.js     # Reports and analytics
│   ├── styles/
│   │   └── x_admin.css        # All admin styles with x_ classes
│   ├── App.js                 # Main app with routing
│   ├── index.js               # React entry point
│   └── index.css              # Global styles
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── package.json
└── README.md
```

## Styling

The admin panel uses custom CSS classes with the `x_` prefix pattern for consistency:

- `x_btn*` - Button styles (primary, success, danger, warning, secondary)
- `x_card` - Card containers
- `x_form-*` - Form elements
- `x_table` - Table styling
- `x_grid-*` - Grid layouts
- `x_stat-*` - Statistics card styling
- `x_modal-*` - Modal dialog styles
- `x_sidebar*` - Navigation sidebar
- `x_header*` - Header styles
- `x_nav-*` - Navigation menu

## Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Features Breakdown

### Navigation
- Fixed sidebar with collapsible menu on mobile
- Clear icon-based navigation
- Active page highlighting
- Responsive menu toggle

### Forms
- Text inputs, selects, textareas
- Form validation
- Modal dialogs for create/edit operations
- Status management

### Tables
- Responsive horizontal scrolling on mobile
- Action buttons (Edit, Delete, View)
- Status badges
- Sortable headers (ready for implementation)

### Cards
- Stat cards for metrics
- Product/category cards for grid layouts
- Reusable card components
- Consistent styling

## Data Management

Currently, the admin panel uses React state for data management. For production use:

1. Replace state with API calls (using axios)
2. Implement proper authentication tokens
3. Add error handling and loading states
4. Implement data persistence

### Example API Integration

```javascript
// Get all products
axios.get('/api/products')
  .then(response => setProducts(response.data))
  .catch(error => console.error(error));

// Create new category
axios.post('/api/categories', formData)
  .then(response => {/* update state */})
  .catch(error => {/* handle error */});

// Update product
axios.put(`/api/products/${id}`, formData)
  .then(response => {/* update state */})
  .catch(error => {/* handle error */});
```

## Mobile Responsiveness

### Breakpoints
- **Desktop**: 769px and above
- **Tablet**: 577px - 768px
- **Mobile**: 376px - 576px
- **Small Mobile**: Below 376px
- **Extra Small**: 320px and below

Each breakpoint has optimized:
- Font sizes
- Spacing and padding
- Grid layouts
- Table display
- Navigation behavior

## Future Enhancements

1. Real API integration with backend
2. Advanced filtering and search
3. Bulk actions (delete multiple, bulk edit)
4. Charts and data visualization
5. Audit logs and activity tracking
6. User roles and permissions
7. Email notifications
8. Data export features
9. Dark mode
10. Internationalization (i18n)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Proprietary - PoshVue

## Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2, 2024
