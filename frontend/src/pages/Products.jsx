import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  ArrowUpDown,
  Download,
  CheckCircle2,
  DollarSign,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Server,
  Cpu,
  Shield,
  Briefcase,
  Boxes,
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
        sortBy,
        sortOrder,
      });
      setProducts(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message || 'Failed to fetch product catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, activeFilter, sortBy, sortOrder, pagination.limit, showToast]);

  useEffect(() => {
    fetchProducts(1);
  }, [debouncedSearch, categoryFilter, activeFilter, sortBy, sortOrder]);

  const handleSortToggle = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

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
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setActiveFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || categoryFilter || activeFilter);

  // CSV Export for Product Catalog
  const exportCatalogCSV = () => {
    if (!products || products.length === 0) return;
    const lines = [];
    lines.push('Smart BI - Product Catalog & Offerings');
    lines.push(`Exported Date,${new Date().toLocaleString()}`);
    lines.push(`Filter Category,${categoryFilter || 'All Categories'}`);
    lines.push(`Filter Status,${activeFilter ? (activeFilter === 'true' ? 'Active Only' : 'Inactive Only') : 'All Statuses'}`);
    lines.push('');
    lines.push('Product ID,Product Name,Category,Unit Price (USD),Status');
    products.forEach((p) => {
      lines.push(`${p.id},"${p.product_name}","${p.category}",${p.unit_price},"${p.is_active ? 'Active' : 'Discontinued'}"`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_bi_product_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Product catalog CSV exported successfully', 'success');
  };

  const getCategoryClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('ai') || c.includes('analytics')) return 'category-ai';
    if (c.includes('cloud')) return 'category-cloud';
    if (c.includes('cyber') || c.includes('security')) return 'category-cyber';
    if (c.includes('services') || c.includes('software')) return 'category-services';
    return 'category-default';
  };

  const getCategoryIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('ai') || c.includes('analytics')) return <Cpu size={15} color="#7c3aed" />;
    if (c.includes('cloud')) return <Server size={15} color="#0284c7" />;
    if (c.includes('cyber') || c.includes('security')) return <Shield size={15} color="#d97706" />;
    if (c.includes('services')) return <Briefcase size={15} color="#2563eb" />;
    return <Boxes size={15} color="#64748b" />;
  };

  // Portfolio metrics computed from loaded products
  const activeProductsCount = useMemo(() => {
    return products.filter((p) => p.is_active).length;
  }, [products]);

  const avgCatalogPrice = useMemo(() => {
    if (products.length === 0) return 0;
    const sum = products.reduce((acc, p) => acc + (parseFloat(p.unit_price) || 0), 0);
    return sum / products.length;
  }, [products]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>Products & Catalog</h2>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Inventory Suite
            </span>
          </div>
          <p className="page-subtitle">View and manage all products, categories, and pricing</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportCatalogCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '7px 14px' }}
            title="Export catalog as CSV"
          >
            <Download size={14} />
            <span>Export Catalog</span>
          </button>

          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.875rem' }}
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Portfolio Overview KPI Cards */}
      <div className="grid-cols-4" style={{ gap: '16px' }}>
        {/* Total Offerings */}
        <div className="stat-card stat-card-revenue">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">TOTAL OFFERINGS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={16} />
            </div>
          </div>
          <div className="stat-value">{pagination.total || products.length}</div>
          <div className="stat-footer">Indexed offerings in catalog</div>
        </div>

        {/* Active Offerings */}
        <div className="stat-card stat-card-orders">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">ACTIVE OFFERINGS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-value">{activeProductsCount} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>on page</span></div>
          <div className="stat-footer">Ready for new customer orders</div>
        </div>

        {/* Product Verticals */}
        <div className="stat-card stat-card-customers">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">PRODUCT VERTICALS</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={16} />
            </div>
          </div>
          <div className="stat-value">5 <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Domains</span></div>
          <div className="stat-footer">Cloud, Software, Cyber, AI & Services</div>
        </div>

        {/* Average Unit Price */}
        <div className="stat-card stat-card-offerings">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="stat-title">AVG BASE PRICE</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.1)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={16} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(avgCatalogPrice)}</div>
          <div className="stat-footer">Average catalog list price</div>
        </div>
      </div>

      {/* Filter and Quick Category Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Quick Category Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, marginRight: '4px' }}>
            Category:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid',
              borderColor: categoryFilter === '' ? 'var(--primary)' : 'var(--border-subtle)',
              background: categoryFilter === '' ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
              color: categoryFilter === '' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            All Categories ({pagination.total || 41})
          </button>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--border-subtle)',
                background: categoryFilter === cat ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
                color: categoryFilter === cat ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Dropdowns and Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
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
            style={{ width: '190px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
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

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={resetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '6px 10px' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Table in Elevated Glass Panel */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Catalog Offerings
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-main)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {pagination.total} Total Records
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
        </div>

        <div className="table-responsive">
          {loading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : products.length === 0 ? (
            <div style={{ padding: '30px' }}>
              <EmptyState
                title="No products found"
                message="No products match the selected filters or search keyword."
                action={
                  hasActiveFilters && (
                    <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th
                    style={{ width: '80px', cursor: 'pointer' }}
                    onClick={() => handleSortToggle('id')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>ID</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSortToggle('product_name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>PRODUCT NAME</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSortToggle('category')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>CATEGORY</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th
                    style={{ cursor: 'pointer', textAlign: 'right' }}
                    onClick={() => handleSortToggle('unit_price')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span>UNIT PRICE (USD)</span>
                      <ArrowUpDown size={12} color="var(--text-dim)" />
                    </div>
                  </th>
                  <th style={{ textAlign: 'center' }}>STATUS</th>
                  {canManage && <th style={{ textAlign: 'right', width: '100px' }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-main)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        #{p.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIcon(p.category)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                            {p.product_name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                            SKU: PRD-{String(p.id).padStart(4, '0')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`category-pill ${getCategoryClass(p.category)}`}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)', textAlign: 'right', fontSize: '0.875rem' }}>
                      {formatCurrency(p.unit_price)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge
                        variant={p.is_active ? 'active' : 'inactive'}
                        label={p.is_active ? 'Active' : 'Discontinued'}
                      />
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Edit Product"
                            onClick={() => handleOpenModal(p)}
                          >
                            <Edit2 size={13} />
                          </button>
                          {isAdmin && p.is_active && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                              title="Deactivate Product"
                              onClick={() => handleDeactivate(p.id, p.product_name)}
                            >
                              <Trash2 size={13} />
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

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(newPage) => fetchProducts(newPage)}
          />
        </div>
      </div>

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
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
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
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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
