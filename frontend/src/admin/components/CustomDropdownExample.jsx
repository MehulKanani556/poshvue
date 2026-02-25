import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';

const CustomDropdownExample = () => {
  const [singleValue, setSingleValue] = useState('');
  const [multiValue, setMultiValue] = useState([]);
  const [searchableValue, setSearchableValue] = useState('');
  const [disabledValue, setDisabledValue] = useState('option2');

  // Sample options data
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'toys', label: 'Toys & Games' }
  ];

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'in', label: 'India' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Custom Dropdown Examples</h2>
      
      {/* Basic Single Select */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Basic Single Select</h3>
        <CustomDropdown
          label="Status"
          options={statusOptions}
          value={singleValue}
          onChange={setSingleValue}
          placeholder="Select status"
          required
        />
        <p>Selected value: {singleValue}</p>
      </div>

      {/* Multi Select */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Multi Select</h3>
        <CustomDropdown
          label="Categories"
          options={categoryOptions}
          value={multiValue}
          onChange={setMultiValue}
          placeholder="Select categories"
          multiSelect
        />
        <p>Selected values: {multiValue.join(', ')}</p>
      </div>

      {/* Searchable Dropdown */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Searchable Dropdown</h3>
        <CustomDropdown
          label="Country"
          options={countryOptions}
          value={searchableValue}
          onChange={setSearchableValue}
          placeholder="Search and select country"
          searchable
        />
        <p>Selected value: {searchableValue}</p>
      </div>

      {/* Disabled Dropdown */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Disabled Dropdown</h3>
        <CustomDropdown
          label="Disabled Field"
          options={statusOptions}
          value={disabledValue}
          onChange={setDisabledValue}
          disabled
        />
      </div>

      {/* With Error */}
      <div style={{ marginBottom: '30px' }}>
        <h3>With Error State</h3>
        <CustomDropdown
          label="Priority"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
          value=""
          onChange={() => {}}
          placeholder="Select priority"
          required
          error="This field is required"
        />
      </div>

      {/* String Options (Simple) */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Simple String Options</h3>
        <CustomDropdown
          label="Size"
          options={['Small', 'Medium', 'Large', 'X-Large']}
          value=""
          onChange={() => {}}
          placeholder="Select size"
        />
      </div>
    </div>
  );
};

export default CustomDropdownExample;
