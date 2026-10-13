import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { productsApi } from '../api/products.api';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');

  const debouncedSearch = useDebounce(searchTerm, 350);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Cloud Infrastructure',
    unit_price: '',
    is_active: true,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { canManage, isAdmin } = useAuth();
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
        sortBy,
        sortOrder,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err.message || 'Failed to fetch product catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, activeFilter, sortBy, sortOrder, pagination.limit, showToast]);

  useEffect(() => {
    fetchProducts(1);
  }, [debouncedSearch, categoryFilter, activeFilter, sortBy, sortOrder]);

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        product_name: prod.product_name,
        category: prod.category,
        unit_price: prod.unit_price,
        is_active: prod.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: '',
        category: 'Cloud Infrastructure',
        unit_price: '',
        is_active: true,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.unit_price);
    if (!formData.product_name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Unit price must be a valid number greater than zero');
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        product_name: formData.product_name.trim(),
        category: formData.category,
        unit_price: priceNum,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
        showToast(`Product '${payload.product_name}' updated successfully!`, 'success');
      } else {
        await productsApi.createProduct(payload);
        showToast(`Product '${payload.product_name}' created successfully!`, 'success');
      }
      setIsModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate product '${name}'?`)) return;
    try {
      await productsApi.deleteProduct(id);
      showToast(`Product '${name}' deactivated successfully`, 'success');
      fetchProducts(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to deactivate product', 'error');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Products & Catalog</h2>
          <p className="page-subtitle">View and manage all products, categories, and pricing</p>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by product name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '200px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Cloud Infrastructure">Cloud Infrastructure</option>
          <option value="Enterprise Software">Enterprise Software</option>
          <option value="Cybersecurity">Cybersecurity</option>
          <option value="Analytics & AI">Analytics & AI</option>
          <option value="Professional Services">Professional Services</option>
        </select>

        <select
          className="form-control"
          style={{ width: '150px' }}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-responsive">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message="No products match the selected filters."
            action={
              (searchTerm || categoryFilter || activeFilter) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSearchTerm(''); setCategoryFilter(''); setActiveFilter(''); }}
                >
                  Reset Filters
                </button>
              )
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price (USD)</th>
                <th>Status</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>#{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Package size={18} color="var(--primary)" />
                      <span style={{ fontWeight: 600 }}>{p.product_name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{p.category}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#34d399' }}>{formatCurrency(p.unit_price)}</td>
                  <td>
                    <Badge
                      variant={p.is_active ? 'active' : 'inactive'}
                      label={p.is_active ? 'Active' : 'Discontinued'}
                    />
                  </td>
                  {canManage && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Edit Product"
                          onClick={() => handleOpenModal(p)}
                        >
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && p.is_active && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px' }}
                            title="Deactivate Product"
                            onClick={() => handleDeactivate(p.id, p.product_name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(newPage) => fetchProducts(newPage)}
      />

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.product_name}` : 'Create New Product Offering'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn btn-primary" disabled={modalLoading}>
              {modalLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleFormSubmit}>
          {formError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Enterprise Security Gateway"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Enterprise Software">Enterprise Software</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Analytics & AI">Analytics & AI</option>
                <option value="Professional Services">Professional Services</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="499.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              Active product offering (available for new sales orders)
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
