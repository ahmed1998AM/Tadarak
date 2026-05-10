/**
 * HR Pro System - Unified API Service
 * Handles all backend communication with JWT authentication
 */

class ApiService {
    constructor() {
        // Use AppConfig if available, otherwise fallback to current origin
        this.baseURL = window.AppConfig ? 
            window.AppConfig.API_BASE_URL : 
            window.location.origin + '/api';
        
        this.token = localStorage.getItem('hrpro_token');
        this.refreshToken = localStorage.getItem('hrpro_refresh_token');
        this.currentCompany = localStorage.getItem('hrpro_company_id');
        
        // Auto-refresh token setup
        this.setupTokenRefresh();
    }

    /**
     * Get authentication headers
     */
    getHeaders(includeContent = true) {
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'X-Company-ID': this.currentCompany || ''
        };
        
        if (includeContent) {
            headers['Content-Type'] = 'application/json';
        }
        
        return headers;
    }

    /**
     * Handle API response and errors
     */
    async handleResponse(response) {
        if (response.status === 401) {
            // Token expired, try to refresh
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry the original request
                return this.retryLastRequest(response.config);
            }
            // Redirect to login
            window.location.href = '/index.html?session=expired';
            throw new Error('Session expired');
        }

        if (response.status === 403) {
            throw new Error('لا تملك الصلاحية للوصول إلى هذا المورد');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
            throw new Error(error.message || 'حدث خطأ في الاتصال بالخادم');
        }

        return response.json();
    }

    /**
     * Generic GET request
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(false)
        });
        
        return this.handleResponse(response);
    }

    /**
     * Generic POST request
     */
    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }

    /**
     * Generic PUT request
     */
    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    }

    /**
     * Generic DELETE request
     */
    async delete(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(false)
        });
        
        return this.handleResponse(response);
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.accessToken;
                localStorage.setItem('hrpro_token', data.accessToken);
                
                if (data.refreshToken) {
                    this.refreshToken = data.refreshToken;
                    localStorage.setItem('hrpro_refresh_token', data.refreshToken);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        
        return false;
    }

    /**
     * Setup automatic token refresh
     */
    setupTokenRefresh() {
        // Check token expiry every minute
        setInterval(async () => {
            const tokenData = this.parseToken(this.token);
            if (tokenData && tokenData.exp) {
                const now = Math.floor(Date.now() / 1000);
                const timeUntilExpiry = tokenData.exp - now;
                
                // Refresh if less than 5 minutes remaining
                if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
                    await this.refreshAccessToken();
                }
            }
        }, 60000);
    }

    /**
     * Parse JWT token
     */
    parseToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }

    /**
     * Set current company context
     */
    setCompany(companyId) {
        this.currentCompany = companyId;
        localStorage.setItem('hrpro_company_id', companyId);
    }

    /**
     * Logout and clear tokens
     */
    logout() {
        localStorage.removeItem('hrpro_token');
        localStorage.removeItem('hrpro_refresh_token');
        localStorage.removeItem('hrpro_company_id');
        this.token = null;
        this.refreshToken = null;
        this.currentCompany = null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        if (!this.token) return false;
        
        const tokenData = this.parseToken(this.token);
        if (!tokenData || !tokenData.exp) return false;
        
        const now = Math.floor(Date.now() / 1000);
        return tokenData.exp > now;
    }

    /**
     * Get current user info from token
     */
    getCurrentUser() {
        const tokenData = this.parseToken(this.token);
        if (!tokenData) return null;
        
        return {
            id: tokenData.userId,
            email: tokenData.email,
            name: tokenData.name,
            role: tokenData.role,
            permissions: tokenData.permissions || [],
            company: tokenData.companyId
        };
    }
}

// Create global instance
window.api = new ApiService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
