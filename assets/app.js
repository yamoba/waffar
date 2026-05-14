// ========== API Configuration ==========
// In dev: backend on :5000. In production: same-origin /api (Railway serves both)
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : (window.BACKEND_URL ? window.BACKEND_URL + '/api' : '/api');

// ========== AUTH MANAGEMENT ==========
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        try {
            this.user = JSON.parse(localStorage.getItem('user')) || null;
        } catch (e) {
            this.user = null;
            localStorage.removeItem('user');
        }
        this.setupAutoLogout();
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('loginTime', Date.now().toString());
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    setupAutoLogout() {
        const checkTokenValidity = () => {
            if (!this.isAuthenticated()) return;
            const loginTime = parseInt(localStorage.getItem('loginTime')) || 0;
            if (loginTime === 0) return;
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - loginTime > sevenDaysMs) {
                this.logout();
                window.location.href = '/login.html';
            }
        };
        setInterval(checkTokenValidity, 60000); // Check every minute
    }
}

const auth = new AuthManager();

// ========== UI UTILITIES ==========

class UIManager {
    static showAlert(message, type = 'success') {
        const alertId = 'alert-' + Date.now();
        const alertHTML = `
            <div class="alert alert-${type}" id="${alertId}" style="animation: slideInDown 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2em;">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        const alertContainer = document.getElementById('alert-container') || 
                              (() => {
                                  const div = document.createElement('div');
                                  div.id = 'alert-container';
                                  div.style.position = 'fixed';
                                  div.style.top = '80px';
                                  div.style.right = '20px';
                                  div.style.zIndex = '10000';
                                  document.body.appendChild(div);
                                  return div;
                              })();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = alertHTML;
        alertContainer.appendChild(tempDiv.firstElementChild);
        
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.style.animation = 'slideInUp 0.3s ease reverse';
                setTimeout(() => alert.remove(), 300);
            }
        }, 4000);
    }

    static showLoader() {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.id = 'global-loader';
        document.body.appendChild(loader);
    }

    static hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.remove();
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0
        }).format(price);
    }

    static showModal(title, content, actions = []) {
        const modalHTML = `
            <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) this.remove()">
                <div class="modal" style="animation: slideInUp 0.3s ease;">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${actions.length > 0 ? `
                        <div class="modal-footer">
                            ${actions.map(a => `<button class="btn btn-${a.type || 'secondary'}" onclick="${a.action}">${a.label}</button>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
    }
}

// ========== API FUNCTIONS WITH ERROR HANDLING ==========

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: auth.getHeaders()
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            const errorMsg = result.message || `Error: ${response.status}`;
            UIManager.showAlert(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        if (error.message.includes('token')) {
            auth.logout();
            window.location.href = '/login.html';
        }
        throw error;
    }
}

// Auth Functions
async function signup(data) {
    try {
        const result = await apiCall('/auth/signup', 'POST', data);
        auth.setAuth(result.token, result.user);
        UIManager.showAlert('Account created!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function login(data) {
    try {
        const result = await apiCall('/auth/login', 'POST', data);
        auth.setAuth(result.token, result.user);
        UIManager.showAlert('Login successful!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function getProfile() {
    try {
        return await apiCall('/auth/me', 'GET');
    } catch (error) {
        console.error('Profile fetch failed:', error);
        throw error;
    }
}

async function updateProfile(data) {
    try {
        const result = await apiCall('/auth/profile', 'PUT', data);
        auth.user = result.user;
        localStorage.setItem('user', JSON.stringify(result.user));
        UIManager.showAlert('Profile updated!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

// Product Functions
async function getProducts(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        return await apiCall(`/products?${params}`, 'GET');
    } catch (error) {
        UIManager.showAlert('Failed to load products', 'error');
        throw error;
    }
}

async function getProduct(id) {
    try {
        return await apiCall(`/products/${id}`, 'GET');
    } catch (error) {
        UIManager.showAlert('Product not found', 'error');
        throw error;
    }
}

async function addProduct(data) {
    try {
        if (!auth.isAuthenticated()) {
            UIManager.showAlert('Please login to add products', 'warning');
            return;
        }
        const result = await apiCall('/products', 'POST', data);
        UIManager.showAlert('Product added!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

// Comparison Functions
async function getComparisons() {
    try {
        if (!auth.isAuthenticated()) return { success: true, data: [] };
        return await apiCall('/comparisons', 'GET');
    } catch (error) {
        console.error('Comparisons error:', error);
        return { success: true, data: [] };
    }
}

async function createComparison(data) {
    try {
        if (!auth.isAuthenticated()) {
            UIManager.showAlert('Please login to save comparisons', 'warning');
            return;
        }
        const result = await apiCall('/comparisons', 'POST', data);
        UIManager.showAlert('Comparison saved!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function deleteComparison(id) {
    try {
        const result = await apiCall(`/comparisons/${id}`, 'DELETE');
        UIManager.showAlert('Comparison deleted!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

// Wishlist Functions
async function addToWishlist(productId) {
    try {
        if (!auth.isAuthenticated()) {
            UIManager.showAlert('Please login to add to wishlist', 'warning');
            return;
        }
        const result = await apiCall('/wishlist', 'POST', { productId });
        UIManager.showAlert('Added to wishlist!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function removeFromWishlist(productId) {
    try {
        const result = await apiCall(`/wishlist/${productId}`, 'DELETE');
        UIManager.showAlert('Removed from wishlist!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function getWishlist() {
    try {
        if (!auth.isAuthenticated()) return { success: true, data: [] };
        return await apiCall('/wishlist', 'GET');
    } catch (error) {
        console.error('Wishlist error:', error);
        return { success: true, data: [] };
    }
}

// AI Search Functions
async function aiSearch(query) {
    try {
        if (!query.trim()) {
            UIManager.showAlert('Please enter a search query', 'warning');
            return;
        }
        if (!auth.isAuthenticated()) {
            UIManager.showAlert('Please login to use AI search', 'warning');
            return;
        }
        return await apiCall('/ai-search', 'POST', { query });
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

async function getAISearchHistory() {
    try {
        if (!auth.isAuthenticated()) return { success: true, data: [] };
        return await apiCall('/ai-search-history', 'GET');
    } catch (error) {
        console.error('History error:', error);
        return { success: true, data: [] };
    }
}

async function setClaudeApiKey(key) {
    try {
        if (!auth.isAuthenticated()) {
            UIManager.showAlert('Please login first', 'warning');
            return;
        }
        const result = await apiCall('/auth/claude-key', 'POST', { claudeApiKey: key });
        UIManager.showAlert('API key saved!', 'success');
        return result;
    } catch (error) {
        UIManager.showAlert(error.message, 'error');
        throw error;
    }
}

// ========== PAGE UTILITIES =====

function updateNavigation() {
    const authLinks = document.querySelectorAll('[data-auth-required]');
    const loginBtn = document.getElementById('login-btn');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (auth.isAuthenticated()) {
        authLinks.forEach(link => link.style.display = 'block');
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenuBtn) userMenuBtn.style.display = 'flex';
        
        const userName = document.getElementById('user-name');
        if (userName) userName.textContent = auth.user?.name || 'User';
    } else {
        authLinks.forEach(link => link.style.display = 'none');
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenuBtn) userMenuBtn.style.display = 'none';
    }
}

function logoutUser() {
    auth.logout();
    UIManager.showAlert('Logged out successfully!', 'success');
    setTimeout(() => window.location.href = '/index.html', 1000);
}

// ========== UTILITY FUNCTIONS =====

const formatPrice = UIManager.formatPrice;

const Storage = {
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    get: (key) => JSON.parse(localStorage.getItem(key)),
    remove: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
};

// ========== INITIALIZE ON PAGE LOAD =====

document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    
    // Setup user menu toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.style.display = 'none';
        });
    }
});

// ========== GLOBAL UI HELPERS ==========

function showAlert(message, type = 'success') {
    UIManager.showAlert(message, type);
}

function showLoader() {
    UIManager.showLoader();
}

function hideLoader() {
    UIManager.hideLoader();
}

function setFormLoading(form, loading) {
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
        btn.textContent = 'Loading...';
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText || btn.textContent;
    }
}

async function addSampleProducts() {
    return await apiCall('/demo/add-products', 'POST');
}

// Demo functions for testing
function demoLogin() {
    login({ email: 'demo@waffar.eg', password: 'demo123456' });
}

function demoSignup() {
    signup({ 
        name: 'Demo User', 
        email: `demo${Date.now()}@waffar.eg`, 
        password: 'demo123456', 
        confirmPassword: 'demo123456' 
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, apiCall, signup, login, getProfile, updateProfile };
}


// ========== THEME MANAGER ==========

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('waffar-theme') || 'light';
        this.apply(this.theme);
    }

    apply(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('waffar-theme', theme);
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    toggle() {
        this.apply(this.theme === 'dark' ? 'light' : 'dark');
    }
}

const themeManager = new ThemeManager();

// ========== SCROLL REVEAL ==========

class ScrollReveal {
    constructor() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    this.observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }

    init() {
        document.querySelectorAll('[data-reveal]').forEach(el => {
            this.observer.observe(el);
        });
    }
}

// ========== ANIMATED COUNTER ==========

class AnimatedCounter {
    static animate(el, target, duration = 1600) {
        const start = 0;
        const startTime = performance.now();
        const easeOut = t => 1 - Math.pow(1 - t, 3);

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor(easeOut(progress) * target);
            const suffix = el.dataset.suffix || '';
            el.textContent = value.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    }

    static initAll() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count) || 0;
                    AnimatedCounter.animate(el, target);
                    counterObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));
    }
}

// ========== BACK TO TOP ==========

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) {
        const b = document.createElement('button');
        b.id = 'back-to-top';
        b.className = 'back-to-top';
        b.textContent = '↑';
        b.setAttribute('aria-label', 'Back to top');
        b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(b);
        window.addEventListener('scroll', () => {
            b.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
    }
}

// ========== HEADER SCROLL EFFECT ==========

function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
}

// ========== HAMBURGER MENU ==========

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
            hamburger.classList.remove('open');
            mobileNav.classList.remove('open');
        }
    });
}

// ========== TOAST NOTIFICATION SYSTEM ==========

class Toast {
    static container = null;

    static getContainer() {
        if (!Toast.container) {
            Toast.container = document.createElement('div');
            Toast.container.id = 'toast-container';
            document.body.appendChild(Toast.container);
        }
        return Toast.container;
    }

    static show(message, type = 'success', title = null, duration = 4000) {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };
        const id = 'toast-' + Date.now() + Math.random().toString(36).slice(2);
        const container = Toast.getContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = id;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-body">
                <div class="toast-title">${title || titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="Toast.dismiss('${id}')">×</button>
        `;
        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('toast-close')) Toast.dismiss(id);
        });

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => Toast.dismiss(id), duration);
        }
        return id;
    }

    static dismiss(id) {
        const toast = document.getElementById(id);
        if (!toast) return;
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 320);
    }

    static success(msg, title) { return Toast.show(msg, 'success', title); }
    static error(msg, title) { return Toast.show(msg, 'error', title); }
    static warning(msg, title) { return Toast.show(msg, 'warning', title); }
    static info(msg, title) { return Toast.show(msg, 'info', title); }
}

// Override legacy showAlert to use Toast
function showAlert(message, type = 'success') {
    Toast.show(message, type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'success');
}

// ========== SKELETON LOADERS ==========

const Skeleton = {
    productCard() {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-card-body">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text w-75"></div>
                    <div class="skeleton skeleton-text w-50"></div>
                    <div style="display:flex;gap:8px;margin-top:12px">
                        <div class="skeleton skeleton-btn"></div>
                        <div class="skeleton skeleton-btn" style="width:38px"></div>
                    </div>
                </div>
            </div>`;
    },

    grid(count = 8) {
        return Array(count).fill(0).map(() => Skeleton.productCard()).join('');
    },

    row(lines = 3) {
        return Array(lines).fill(0).map((_, i) =>
            `<div class="skeleton skeleton-text" style="width:${[100,75,50][i % 3]}%"></div>`
        ).join('');
    }
};

// ========== NEW API FUNCTIONS ==========

async function getDeals(limit = 8) {
    try {
        return await apiCall(`/products/deals?limit=${limit}`, 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function getTrending(limit = 6) {
    try {
        return await apiCall(`/products/trending?limit=${limit}`, 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function getFeatured(limit = 8) {
    try {
        return await apiCall(`/products/featured?limit=${limit}`, 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function getCategories() {
    try {
        return await apiCall('/categories', 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function getProductsByCategory(category, limit = 12, page = 0) {
    try {
        return await apiCall(`/products/category/${encodeURIComponent(category)}?limit=${limit}&page=${page}`, 'GET');
    } catch (e) {
        return { success: true, data: [], total: 0 };
    }
}

async function getSearchSuggestions(q) {
    try {
        if (!q || q.length < 2) return { success: true, data: [] };
        return await apiCall(`/products/suggestions?q=${encodeURIComponent(q)}`, 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function recordProductView(productId) {
    try {
        return await apiCall(`/products/${productId}/view`, 'PUT');
    } catch (e) {
        // silently fail
    }
}

async function createPriceAlert(data) {
    try {
        if (!auth.isAuthenticated()) {
            Toast.warning('Please login to create price alerts');
            return;
        }
        const result = await apiCall('/alerts', 'POST', data);
        Toast.success('Price alert created! We\'ll notify you when the price drops.');
        return result;
    } catch (e) {
        Toast.error(e.message || 'Failed to create alert');
        throw e;
    }
}

async function getPriceAlerts() {
    try {
        if (!auth.isAuthenticated()) return { success: true, data: [] };
        return await apiCall('/alerts', 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

async function deletePriceAlert(id) {
    try {
        const result = await apiCall(`/alerts/${id}`, 'DELETE');
        Toast.success('Alert removed');
        return result;
    } catch (e) {
        Toast.error(e.message);
        throw e;
    }
}

async function getUserStats() {
    try {
        if (!auth.isAuthenticated()) return { success: true, data: {} };
        return await apiCall('/auth/stats', 'GET');
    } catch (e) {
        return { success: true, data: {} };
    }
}

async function getPriceHistory(productId) {
    try {
        return await apiCall(`/products/${productId}/history`, 'GET');
    } catch (e) {
        return { success: true, data: [] };
    }
}

// ========== COMPARISON BAR MANAGER ==========

class ComparisonManager {
    constructor() {
        this.items = [];
        this.bar = null;
        this.maxItems = 3;
    }

    init() {
        this.bar = document.getElementById('comparison-bar');
        if (!this.bar) {
            this.bar = document.createElement('div');
            this.bar.id = 'comparison-bar';
            this.bar.className = 'comparison-bar';
            this.bar.innerHTML = `
                <span style="color:rgba(255,255,255,0.6);font-size:13px;white-space:nowrap">Compare:</span>
                <div class="comparison-items" id="comparison-items"></div>
                <div style="display:flex;gap:8px;flex-shrink:0">
                    <button class="btn btn-primary btn-small" onclick="comparisonManager.compare()">Compare Now</button>
                    <button class="btn btn-ghost btn-small" style="color:rgba(255,255,255,0.5)" onclick="comparisonManager.clear()">Clear</button>
                </div>`;
            document.body.appendChild(this.bar);
        }
    }

    add(product) {
        if (this.items.find(p => p._id === product._id)) {
            Toast.info('Product already in comparison');
            return;
        }
        if (this.items.length >= this.maxItems) {
            Toast.warning(`Max ${this.maxItems} products for comparison`);
            return;
        }
        this.items.push(product);
        this.render();
        Toast.success(`${product.name} added to comparison`);
    }

    remove(id) {
        this.items = this.items.filter(p => p._id !== id);
        this.render();
    }

    render() {
        if (!this.bar) this.init();
        const itemsEl = document.getElementById('comparison-items');
        if (!itemsEl) return;
        itemsEl.innerHTML = this.items.map(p => `
            <div class="comparison-item">
                ${p.name.substring(0, 25)}${p.name.length > 25 ? '...' : ''}
                <button class="comparison-item-remove" onclick="comparisonManager.remove('${p._id}')">×</button>
            </div>`).join('');
        this.bar.classList.toggle('visible', this.items.length > 0);
    }

    clear() {
        this.items = [];
        this.render();
    }

    compare() {
        if (this.items.length < 2) {
            Toast.warning('Add at least 2 products to compare');
            return;
        }
        const ids = this.items.map(p => p._id).join(',');
        window.location.href = `price_compare.html?ids=${ids}`;
    }
}

const comparisonManager = new ComparisonManager();

// ========== PRODUCT CARD RENDERER ==========

function renderProductCard(product, options = {}) {
    const price = product.lowestPrice || product.price || 0;
    const discount = product.discount || 0;
    const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : null;
    const badgeMap = { trending: 'hot', new: 'new', sale: 'sale' };
    const badgeType = discount > 20 ? 'sale' : (product.isNew ? 'new' : (product.isTrending ? 'hot' : null));
    const inWishlist = options.wishlistIds && options.wishlistIds.includes(product._id);

    return `
        <div class="product-card" data-id="${product._id}">
            <div class="product-image" style="position:relative">
                ${badgeType ? `<span class="product-badge-${badgeType}">${badgeType === 'hot' ? 'HOT' : badgeType === 'sale' ? 'SALE' : 'NEW'}</span>` : ''}
                ${discount > 0 ? `<span class="product-discount">-${discount}%</span>` : ''}
                <div style="font-size:56px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,var(--bg-light),var(--border-light))">
                    ${getCategoryEmoji(product.category)}
                </div>
                <button class="wishlist-btn ${inWishlist ? 'active' : ''}" 
                    onclick="toggleWishlist(event, '${product._id}')" 
                    title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                    ${inWishlist ? '❤️' : '🤍'}
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'General'}</div>
                <div class="product-name line-clamp-2">${product.name}</div>
                <div class="product-rating">
                    <span class="rating-stars">${'★'.repeat(Math.round(product.rating || 4))}${'☆'.repeat(5 - Math.round(product.rating || 4))}</span>
                    <span style="margin-left:4px">(${product.reviewCount || 0})</span>
                </div>
                <div class="product-price">
                    ${UIManager.formatPrice(price)}
                    ${originalPrice ? `<span style="font-size:13px;color:var(--text-lighter);text-decoration:line-through;margin-left:8px;font-weight:400">${UIManager.formatPrice(originalPrice)}</span>` : ''}
                </div>
                <div class="product-stores">
                    ${(product.stores || []).slice(0, 3).map(s => `<span class="store-chip">${s.store || s}</span>`).join('')}
                    ${(product.stores || []).length > 3 ? `<span class="store-chip">+${(product.stores || []).length - 3}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-small" onclick="viewProduct('${product._id}')">View</button>
                    <button class="btn btn-outline btn-small" onclick="showStorePrices('${product._id}', '${product.name?.slice(0,40)}')" title="Compare store prices">🏪 ${(product.stores||[]).length > 1 ? (product.stores||[]).length+' stores' : 'Prices'}</button>
                    <button class="btn btn-ghost btn-small" onclick="comparisonManager.add(${JSON.stringify({_id: product._id, name: product.name}).replace(/"/g, '&quot;')})">+</button>
                </div>
            </div>
        </div>`;
}

function getCategoryEmoji(category) {
    const map = {
        'Electronics': '📱', 'Laptops': '💻', 'Phones': '📱',
        'Home Appliances': '🏠', 'Fashion': '👗', 'Books': '📚',
        'Sports': '⚽', 'Beauty': '💄', 'Food': '🍕', 'Gaming': '🎮',
        'Cameras': '📷', 'Audio': '🎧', 'Tablets': '📟', 'Watches': '⌚'
    };
    return map[category] || '🛍️';
}

async function toggleWishlist(event, productId) {
    event.stopPropagation();
    if (!auth.isAuthenticated()) {
        Toast.warning('Please login to manage wishlist');
        return;
    }
    const btn = event.currentTarget;
    const isActive = btn.classList.contains('active');
    try {
        if (isActive) {
            await removeFromWishlist(productId);
            btn.classList.remove('active');
            btn.textContent = '🤍';
        } else {
            await addToWishlist(productId);
            btn.classList.add('active');
            btn.textContent = '❤️';
        }
    } catch (e) {
        // already handled
    }
}

function viewProduct(id) {
    recordProductView(id);
    window.location.href = `price_compare.html?id=${id}`;
}

// ========== GLOBAL INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    // Apply theme immediately
    themeManager.apply(themeManager.theme);

    // Theme toggle button
    const themeBtn = document.querySelector('.theme-toggle, #theme-toggle');
    if (themeBtn) {
        themeBtn.textContent = themeManager.theme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', () => themeManager.toggle());
    }

    // Init scroll-based features
    initHeaderScroll();
    initBackToTop();
    initMobileMenu();

    // Scroll reveal
    const sr = new ScrollReveal();
    sr.init();

    // Animated counters
    AnimatedCounter.initAll();

    // Comparison bar
    comparisonManager.init();
});
// ===== MULTI-STORE & ENHANCED API =====
async function getProductStores(productId) {
    const res = await fetch(`/api/products/${productId}/stores`);
    return res.json();
}

async function getSimilarProducts(productId) {
    const res = await fetch(`/api/products/${productId}/similar`);
    return res.json();
}

async function getScrapeStatus() {
    const res = await fetch('/api/scrape/status');
    return res.json();
}

async function triggerScrape(sites = null) {
    const res = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sites ? { sites } : {})
    });
    return res.json();
}

// Show multi-store price modal for a product
async function showStorePrices(productId, productName) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
    modal.innerHTML = `
        <div style="background:var(--card-bg,#1a1a2e);border-radius:16px;padding:1.5rem;max-width:500px;width:100%;border:1px solid var(--border-color,rgba(255,255,255,.1));max-height:80vh;overflow-y:auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                <h3 style="margin:0;font-size:1rem">${productName?.slice(0,50)}...</h3>
                <button onclick="this.closest('[style*=position]').remove()" style="background:none;border:none;color:var(--text-muted,#888);font-size:1.2rem;cursor:pointer">✕</button>
            </div>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:1rem">Compare prices across stores</p>
            <div id="store-prices-list"><div class="skeleton" style="height:60px;border-radius:8px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:8px"></div></div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    try {
        const result = await getProductStores(productId);
        const stores = result.data?.stores || [];
        const list = modal.querySelector('#store-prices-list');
        if (!stores.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">No store data found</p>'; return; }
        const lowestPrice = stores[0]?.price || 0;
        list.innerHTML = stores.map((s, i) => {
            const isLowest = i === 0;
            const diff = lowestPrice ? Math.round((s.price - lowestPrice) / lowestPrice * 100) : 0;
            return `<a href="${s.url || '#'}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:${isLowest ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)'};border-radius:10px;margin-bottom:8px;border:1px solid ${isLowest ? 'rgba(99,102,241,.4)' : 'rgba(255,255,255,.06)'};text-decoration:none;color:inherit">
                <div>
                    <div style="font-weight:600;font-size:14px">${s.storeName}</div>
                    ${isLowest ? '<span style="font-size:11px;color:#6366f1">✓ Best Price</span>' : `<span style="font-size:11px;color:var(--text-muted)">+${diff}% more</span>`}
                </div>
                <div style="text-align:right">
                    <div style="font-weight:700;font-size:16px;color:${isLowest ? '#6366f1' : 'inherit'}">${(s.price||0).toLocaleString()} EGP</div>
                    <div style="font-size:11px;color:${s.inStock ? '#22c55e' : '#ef4444'}">${s.inStock ? '✓ In Stock' : '✗ Out of Stock'}</div>
                </div>
            </a>`;
        }).join('');
    } catch(e) {
        modal.querySelector('#store-prices-list').innerHTML = '<p style="color:#ef4444">Failed to load store prices</p>';
    }
}
