import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  padding,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState(
    multiSelect ? (Array.isArray(value) ? value : []) : value
  );
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Sync selectedValues when value prop changes
  useEffect(() => {
    setSelectedValues(multiSelect ? (Array.isArray(value) ? value : []) : value);
  }, [value, multiSelect]);

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = 350; // Max height from CSS
      
      // Check if there is enough space below, otherwise show above
      const showAbove = rect.bottom + menuHeight > viewportHeight && rect.top > menuHeight;
      
      setDropdownPosition({
        top: showAbove ? rect.top - 2 : rect.bottom + 2,
        left: rect.left,
        width: rect.width,
        transform: showAbove ? 'translateY(-100%)' : 'none'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
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
    const optionValue = typeof option === 'string' ? option : option.value;
    if (multiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(val => val !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newValues);
      if (onChange) onChange(newValues);
    } else {
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
      if (selectedValues === '' || selectedValues === null || selectedValues === undefined) return placeholder;
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

  const handleMenuWheel = (e) => {
    const menu = menuRef.current;
    if (!menu) return;

    const { scrollTop, scrollHeight, clientHeight } = menu.querySelector('.custom-dropdown-options');
    const delta = e.deltaY;

    // Prevent main window scroll if we are at the top/bottom of the dropdown options
    if (delta < 0 && scrollTop === 0) {
      e.preventDefault();
    } else if (delta > 0 && scrollTop + clientHeight >= scrollHeight) {
      e.preventDefault();
    }
  };

  const dropdownMenu = (
    <div 
      className={`custom-dropdown-menu portal-menu ${isOpen ? 'open' : ''}`}
      ref={menuRef}
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        transform: dropdownPosition.transform,
        position: 'fixed'
      }}
      onWheel={handleMenuWheel}
    >
      {searchable && (
        <div className="custom-dropdown-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="custom-dropdown-search-input"
            autoFocus
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
  );

  return (
    <div className={`custom-dropdown-wrapper ${isOpen ? 'is-open' : ''} ${className}`} ref={dropdownRef}>
      {label && (
        <label className="custom-dropdown-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className={`custom-dropdown ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${error ? 'error' : ''}`} ref={triggerRef}>
        <div 
          className="custom-dropdown-trigger"
          onClick={handleToggle}
          style={padding ? { padding } : {}}
          {...props}
        >
          <span className="custom-dropdown-value">
            {getDisplayValue()}
          </span>
          <span className={`custom-dropdown-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        </div>

        {isOpen && createPortal(dropdownMenu, document.body)}
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
