import React from 'react';
import { Search } from 'lucide-react';

export const ProductFilterBar = ({
  searchInputRef,
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  brandFilter,
  onBrandChange,
  brands = [],
  stockFilter,
  onStockChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  activeFilter,
  onActiveChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    searchTerm ||
    categoryFilter ||
    brandFilter ||
    stockFilter ||
    minPrice ||
    maxPrice ||
    activeFilter
  );

  return (
    <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <div className="search-input-wrapper" style={{ minWidth: '200px', flex: '1 1 200px' }}>
        <Search size={15} className="search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          className="form-control search-input"
          placeholder="Search products by name or SKU... (Press / to search)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="form-control"
        style={{ width: '150px' }}
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className="form-control"
        style={{ width: '130px' }}
        value={brandFilter}
        onChange={(e) => onBrandChange(e.target.value)}
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        className="form-control"
        style={{ width: '130px' }}
        value={stockFilter}
        onChange={(e) => onStockChange(e.target.value)}
      >
        <option value="">All Stock</option>
        <option value="low">Low stock</option>
        <option value="out_of_stock">Out of stock</option>
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="number"
          className="form-control"
          style={{ width: '85px' }}
          placeholder="Min ₹"
          min="0"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>-</span>
        <input
          type="number"
          className="form-control"
          style={{ width: '85px' }}
          placeholder="Max ₹"
          min="0"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
        />
      </div>

      <select
        className="form-control"
        style={{ width: '120px' }}
        value={activeFilter}
        onChange={(e) => onActiveChange(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      {hasActiveFilters && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onReset}>
          Reset
        </button>
      )}
    </div>
  );
};

export default ProductFilterBar;
