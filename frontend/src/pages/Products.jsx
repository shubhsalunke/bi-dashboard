import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
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
import { formatCurrency } from '../utils/format';

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
  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Cloud Infrastructure',
    unit_price: '',
    is_active: true,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { canManage } = useAuth();
  const { showToast } = useToast();

  const categoriesList = [
    'Cloud Infrastructure',
    'Enterprise Software',
    'Cybersecurity',
    'Analytics & AI',
    'Professional Services',
  ];

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
  }, [debouncedSearch, categoryFilter, activeFilter]);

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
        showToast(`Product updated successfully`, 'success');
      } else {
        await productsApi.createProduct(payload);
        showToast(`Product created successfully`, 'success');
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

  const searchInputRef = React.useRef(null);
  const [sortField, setSortField] = useState('product_name');
  const [sortAsc, setSortAsc] = useState(true);

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

  const sortedProducts = [...products].sort((a, b) => {
    if (sortField === 'unit_price') {
      const numA = parseFloat(a.unit_price) || 0;
      const numB = parseFloat(b.unit_price) || 0;
      return sortAsc ? numA - numB : numB - numA;
    }
    const valA = (a[sortField] || '').toString().toLowerCase();
    const valB = (b[sortField] || '').toString().toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    if (!products || products.length === 0) return;
    const lines = [];
    lines.push('Product ID,Product Name,Category,Unit Price,Status');
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Product catalog and pricing</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportCSV}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenModal()}
            >
              <Plus size={14} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="form-control search-input"
            placeholder="Search products... (Press / to search)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoriesList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '130px' }}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
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

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              searchTerm || categoryFilter || activeFilter
                ? 'No products match your filter criteria.'
                : 'No products in catalog yet.'
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
                  onClick={() => handleOpenModal()}
                >
                  <Plus size={14} />
                  <span>Add First Product</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      ID {sortField === 'id' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Product Name {sortField === 'product_name' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Category {sortField === 'category' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th onClick={() => handleSort('unit_price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Unit Price {sortField === 'unit_price' ? (sortAsc ? '↑' : '↓') : ''}
                    </th>
                    <th>Status</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
                      <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                      <td>{p.category}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price)}</td>
                      <td>
                        <Badge status={p.is_active ? 'active' : 'inactive'} />
                      </td>
                      {canManage && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenModal(p)}
                              title="Edit product"
                              style={{ padding: '4px 8px' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeletingProduct(p)}
                              title="Toggle status"
                              style={{ padding: '4px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                className="btn btn-primary"
                disabled={modalLoading}
              >
                {modalLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </>
          }
        >
          <form id="product-form" onSubmit={handleFormSubmit}>
            {formError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '12px' }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Product name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categoriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Deactivate Modal */}
      {deletingProduct && (
        <Modal
          isOpen={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          title="Update Product Status"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProduct}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Updating...' : 'Confirm'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
            Are you sure you want to deactivate <strong>{deletingProduct.product_name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default Products;
