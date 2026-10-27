import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { productsApi } from '../api/products.api';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductsTable } from '../components/products/ProductsTable';
import { ProductDeleteModal } from '../components/products/ProductDeleteModal';
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

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [sortField, setSortField] = useState('product_name');
  const [sortAsc, setSortAsc] = useState(true);
  const searchInputRef = useRef(null);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await productsApi.getProducts({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        isActive: activeFilter || undefined,
      });
      setProducts(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, activeFilter, pagination.limit, showToast]);

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
    const lines = ['Product ID,Product Name,Category,Unit Price,Status'];
    products.forEach((p) => {
      lines.push(`"${p.id}","${p.product_name}","${p.category}","${p.unit_price}","${p.is_active ? 'Active' : 'Inactive'}"`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported products to CSV', 'success');
  };

  const sortedProducts = [...products].sort((a, b) => {
    const valA = (a[sortField] || '').toString().toLowerCase();
    const valB = (b[sortField] || '').toString().toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Product catalog and pricing</p>
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

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="form-control search-input"
            placeholder="Search products by name... (Press / to search)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="form-control" style={{ width: '180px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="form-control" style={{ width: '130px' }} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {(searchTerm || categoryFilter || activeFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setActiveFilter(''); }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              searchTerm || categoryFilter || activeFilter
                ? 'Try adjusting your search criteria or category filter.'
                : 'No products registered yet.'
            }
            action={
              (searchTerm || categoryFilter || activeFilter) ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchTerm(''); setCategoryFilter(''); setActiveFilter(''); }}
                >
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
    </div>
  );
};

export default Products;
