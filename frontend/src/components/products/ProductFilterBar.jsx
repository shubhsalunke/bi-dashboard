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
    <div className="filter-bar">
      <div className="search-input-wrapper">
        <Search size={15} className="search-icon" aria-hidden="true" />
        <input
          ref={searchInputRef}
          type="text"
          aria-label="Search products"
          className="form-control search-input"
          placeholder="Search products by name or code..."
          maxLength={100}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="form-control filter-select"
        aria-label="Filter by category"
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
        className="form-control filter-select"
        aria-label="Filter by brand"
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
        className="form-control filter-select"
        aria-label="Filter by stock status"
        value={stockFilter}
        onChange={(e) => onStockChange(e.target.value)}
      >
        <option value="">All Stock</option>
        <option value="low">Low stock</option>
        <option value="out_of_stock">Out of stock</option>
      </select>

      <div className="date-range-group">
        <input
          type="number"
          aria-label="Minimum price"
          className="form-control tabular-nums filter-price-input"
          placeholder="Min ₹"
          min="0"
          max="10000000"
          value={minPrice}
          onChange={(e) => onMinPriceChange(e.target.value)}
        />
        <span className="date-range-sep">-</span>
        <input
          type="number"
          aria-label="Maximum price"
          className="form-control tabular-nums filter-price-input"
          placeholder="Max ₹"
          min="0"
          max="10000000"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(e.target.value)}
        />
      </div>

      <select
        className="form-control filter-select"
        aria-label="Filter by status"
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
