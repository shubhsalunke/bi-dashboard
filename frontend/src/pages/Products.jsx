import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { productsApi } from '../api/products.api';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { ProductFilterBar } from '../components/products/ProductFilterBar';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductsTable } from '../components/products/ProductsTable';
import { ProductDeleteModal } from '../components/products/ProductDeleteModal';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

const CATEGORIES = [
  'Cloud Infrastructure',
  'Enterprise Software',
  'Cybersecurity',
  'Analytics & AI',
  'Professional Services',
];

const BRANDS = ['Tata', 'Infosys', 'Reliance', 'Mahindra', 'Bharat'];

export const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(() => searchParams.get('stock_status') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [detailProductId, setDetailProductId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [sortField, setSortField] = useState('product_name');
  const [sortAsc, setSortAsc] = useState(true);
  const searchInputRef = useRef(null);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const qStock = searchParams.get('stock_status');
    if (qStock !== null) {
      setStockFilter(qStock);
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await productsApi.getProducts({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        stock_status: stockFilter || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        isActive: activeFilter || undefined,
      });
      setProducts(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, brandFilter, stockFilter, minPrice, maxPrice, activeFilter, pagination.limit, showToast]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSaveProduct = async (payload, setFormError) => {
    setModalLoading(true);
    try {
      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await productsApi.createProduct(payload);
        showToast('Product created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      await productsApi.deleteProduct(deletingProduct.id);
      showToast('Product status updated', 'success');
      setDeletingProduct(null);
      fetchProducts(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to update product status', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCSV = () => {
    if (!products || products.length === 0) return;
    const headers = ['SKU', 'Name', 'Category', 'Brand', 'Supplier', 'Unit Price', 'Cost Price', 'Stock', 'Status'];
    const rows = products.map((p) => [
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.product_name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${(p.supplier || '').replace(/"/g, '""')}"`,
      `"${p.unit_price ?? ''}"`,
      `"${p.cost_price ?? ''}"`,
      `"${p.stock_quantity ?? 0}"`,
      `"${p.is_active ? 'Active' : 'Inactive'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported products to CSV', 'success');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setBrandFilter('');
    setStockFilter('');
    setMinPrice('');
    setMaxPrice('');
    setActiveFilter('');
  };

  const sortedProducts = [...products].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    const strA = (valA ?? '').toString().toLowerCase();
    const strB = (valB ?? '').toString().toLowerCase();
    if (strA < strB) return sortAsc ? -1 : 1;
    if (strA > strB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Product catalog, inventory and pricing</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      <ProductFilterBar
        searchInputRef={searchInputRef}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={CATEGORIES}
        brandFilter={brandFilter}
        onBrandChange={setBrandFilter}
        brands={BRANDS}
        stockFilter={stockFilter}
        onStockChange={setStockFilter}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        activeFilter={activeFilter}
        onActiveChange={setActiveFilter}
        onReset={resetFilters}
      />

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              searchTerm || categoryFilter || brandFilter || stockFilter || minPrice || maxPrice || activeFilter
                ? 'Try adjusting your search criteria or category filter.'
                : 'No products registered yet.'
            }
            action={
              (searchTerm || categoryFilter || brandFilter || stockFilter || minPrice || maxPrice || activeFilter) ? (
                <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                  Clear Filters
                </button>
              ) : canManage ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                >
                  <Plus size={14} />
                  <span>Add First Product</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <ProductsTable
              products={sortedProducts}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              canManage={canManage}
              onEdit={(prod) => { setEditingProduct(prod); setIsModalOpen(true); }}
              onToggleStatus={(prod) => setDeletingProduct(prod)}
              onViewDetails={(prod) => {
                setDetailProductId(prod.id);
                setIsDetailModalOpen(true);
              }}
            />

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => fetchProducts(p)}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          product={editingProduct}
          categories={CATEGORIES}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSaveProduct}
          loading={modalLoading}
        />
      )}

      <ProductDeleteModal
        product={deletingProduct}
        loading={deleteLoading}
        onConfirm={handleDeleteProduct}
        onClose={() => setDeletingProduct(null)}
      />

      {isDetailModalOpen && (
        <ProductDetailsModal
          productId={detailProductId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailProductId(null);
          }}
        />
      )}
    </div>
  );
};

export default Products;
