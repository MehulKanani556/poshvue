import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  searchable = false,
  multiSelect = false,
  label,
  required = false,
  error = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState(
    multiSelect ? (Array.isArray(value) ? value : []) : value
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => {
    if (!searchable || !searchTerm) return true;
    const optionLabel = typeof option === 'string' ? option : option.label;
    return optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) setSearchTerm('');
    }
  };

  const handleOptionClick = (option) => {
    if (multiSelect) {
      const optionValue = typeof option === 'string' ? option : option.value;
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(val => val !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newValues);
      if (onChange) onChange(newValues);
    } else {
      const optionValue = typeof option === 'string' ? option : option.value;
      setSelectedValues(optionValue);
      if (onChange) onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const getDisplayValue = () => {
    if (multiSelect) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find(opt => 
          (typeof opt === 'string' ? opt : opt.value) === selectedValues[0]
        );
        return option ? (typeof option === 'string' ? option : option.label) : selectedValues[0];
      }
      return `${selectedValues.length} items selected`;
    } else {
      if (!selectedValues) return placeholder;
      const option = options.find(opt => 
        (typeof opt === 'string' ? opt : opt.value) === selectedValues
      );
      return option ? (typeof option === 'string' ? option : option.label) : selectedValues;
    }
  };

  const getOptionValue = (option) => {
    return typeof option === 'string' ? option : option.value;
  };

  const getOptionLabel = (option) => {
    return typeof option === 'string' ? option : option.label;
  };

  const isSelected = (option) => {
    const optionValue = getOptionValue(option);
    return multiSelect ? selectedValues.includes(optionValue) : selectedValues === optionValue;
  };

  return (
    <div className={`custom-dropdown-wrapper ${className}`} ref={dropdownRef}>
      {label && (
        <label className="custom-dropdown-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className={`custom-dropdown ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`}>
        <div 
          className="custom-dropdown-trigger"
          onClick={handleToggle}
          {...props}
        >
          <span className="custom-dropdown-value">
            {getDisplayValue()}
          </span>
          <span className={`custom-dropdown-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        </div>

        {isOpen && (
          <div className="custom-dropdown-menu">
            {searchable && (
              <div className="custom-dropdown-search">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="custom-dropdown-search-input"
                />
              </div>
            )}
            
            <div className="custom-dropdown-options">
              {filteredOptions.length === 0 ? (
                <div className="custom-dropdown-no-options">
                  No options available
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`custom-dropdown-option ${isSelected(option) ? 'selected' : ''}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {multiSelect && (
                      <span className="custom-dropdown-checkbox">
                        {isSelected(option) ? '✓' : ''}
                      </span>
                    )}
                    <span className="custom-dropdown-option-label">
                      {getOptionLabel(option)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="custom-dropdown-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
