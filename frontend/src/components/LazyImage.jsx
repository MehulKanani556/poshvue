import React from 'react';

/**
 * Simple image component that always lazy‑loads by default.
 *
 * Usage:
 *   <LazyImage src={url} alt="description" className="foo" />
 *
 * It forwards any additional props (e.g. style, onClick) to the underlying
 * <img> element.  You can still override the loading behaviour by passing a
 * different `loading` prop, but the whole point of this component is to save
 * you from having to sprinkle `loading="lazy"` everywhere.
 */
const LazyImage = React.forwardRef(
  ({ src, alt, className, loading = 'lazy', ...rest }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        {...rest}
      />
    );
  }
);

export default LazyImage;
