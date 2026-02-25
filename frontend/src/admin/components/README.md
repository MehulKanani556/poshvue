# Custom Dropdown Component

A responsive, accessible, and feature-rich custom dropdown component for the admin panel.

## Features

- ✅ **Responsive Design**: Optimized for mobile, tablet, and desktop
- ✅ **Searchable**: Built-in search functionality
- ✅ **Multi-select**: Support for selecting multiple options
- ✅ **Accessible**: Keyboard navigation and screen reader support
- ✅ **Customizable**: Extensive styling and configuration options
- ✅ **Error Handling**: Built-in validation and error states
- ✅ **Touch-friendly**: Optimized for mobile touch interactions

## Installation

The component is already created in your admin components folder. Simply import it where needed:

```jsx
import CustomDropdown from '../components/CustomDropdown';
```

## Basic Usage

### Single Select

```jsx
import CustomDropdown from '../components/CustomDropdown';

function MyComponent() {
  const [value, setValue] = useState('');

  const options = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ];

  return (
    <CustomDropdown
      label="Status"
      options={options}
      value={value}
      onChange={setValue}
      placeholder="Select status"
    />
  );
}
```

### Multi Select

```jsx
function MultiSelectExample() {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' }
  ];

  return (
    <CustomDropdown
      label="Categories"
      options={categories}
      value={selectedCategories}
      onChange={setSelectedCategories}
      placeholder="Select categories"
      multiSelect
    />
  );
}
```

### Searchable Dropdown

```jsx
function SearchableExample() {
  const [country, setCountry] = useState('');

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ];

  return (
    <CustomDropdown
      label="Country"
      options={countries}
      value={country}
      onChange={setCountry}
      placeholder="Search and select country"
      searchable
    />
  );
}
```

### Simple String Options

```jsx
function SimpleExample() {
  const [size, setSize] = useState('');

  return (
    <CustomDropdown
      label="Size"
      options={['Small', 'Medium', 'Large', 'X-Large']}
      value={size}
      onChange={setSize}
      placeholder="Select size"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `Array` | `[]` | Array of options. Can be strings or objects with `value` and `label` |
| `value` | `String\|Array` | `''` | Current selected value(s) |
| `onChange` | `Function` | `null` | Callback when selection changes |
| `placeholder` | `String` | `'Select an option'` | Placeholder text |
| `disabled` | `Boolean` | `false` | Whether the dropdown is disabled |
| `className` | `String` | `''` | Additional CSS classes |
| `searchable` | `Boolean` | `false` | Enable search functionality |
| `multiSelect` | `Boolean` | `false` | Enable multiple selection |
| `label` | `String` | `null` | Label for the dropdown |
| `required` | `Boolean` | `false` | Show required asterisk |
| `error` | `String` | `''` | Error message to display |

## Options Format

### Object Format (Recommended)

```jsx
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' }
];
```

### String Format

```jsx
const options = ['Option 1', 'Option 2', 'Option 3'];
```

## Styling

The component uses CSS variables that match your existing admin theme:

- `--x_primary`: Primary color
- `--x_dark`: Dark text color
- `--x_gray`: Gray text color
- `--x_border`: Border color

You can customize these in your CSS:

```css
.custom-dropdown {
  --x-primary: #your-color;
  --x-dark: #your-dark-color;
}
```

## Responsive Behavior

The component automatically adapts to different screen sizes:

- **Desktop (>768px)**: Standard sizing with hover effects
- **Tablet (≤768px)**: Larger touch targets and increased font sizes
- **Mobile (≤480px)**: Even larger touch targets and optimized spacing

## Accessibility Features

- **Keyboard Navigation**: Use arrow keys to navigate, Enter to select, Escape to close
- **Screen Reader Support**: Proper ARIA labels and roles
- **High Contrast Mode**: Support for users with high contrast preferences
- **Reduced Motion**: Respects user's motion preferences

## Examples in Your Project

### Users Page Status Filter

```jsx
<CustomDropdown
  label="Status"
  options={[
    { value: 'All', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ]}
  value={filterStatus}
  onChange={(value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  }}
  placeholder="Select status"
/>
```

### Product Categories with Multi-select

```jsx
<CustomDropdown
  label="Product Categories"
  options={categoryOptions}
  value={selectedCategories}
  onChange={setSelectedCategories}
  placeholder="Select categories"
  multiSelect
  searchable
/>
```

### Country Selection with Search

```jsx
<CustomDropdown
  label="Shipping Country"
  options={countryOptions}
  value={selectedCountry}
  onChange={setSelectedCountry}
  placeholder="Search country..."
  searchable
  required
  error={!selectedCountry ? 'Country is required' : ''}
/>
```

## Migration from Native Select

Replace your existing native selects:

**Before:**
```jsx
<select
  className="x_form-select"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <option value="">Select status</option>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</select>
```

**After:**
```jsx
<CustomDropdown
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]}
  value={status}
  onChange={setStatus}
  placeholder="Select status"
/>
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Dropdown not opening
- Check if the component is disabled
- Ensure there are no JavaScript errors in console
- Verify that the options array is not empty

### Styling issues
- Make sure the CSS file is imported
- Check for conflicting CSS rules
- Verify CSS variables are defined

### Mobile issues
- Ensure touch events are not blocked
- Check for proper viewport meta tag
- Test on actual devices, not just emulators
