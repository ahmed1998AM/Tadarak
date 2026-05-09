/**
 * HR Pro System - Enhanced UI Components
 * Loading states, animations, transitions, and toast notifications
 */

class UIComponents {
    constructor() {
        this.loadingCount = 0;
        this.currentTheme = localStorage.getItem('theme') || 'blue';
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.applyTheme();
        this.setupPageTransitions();
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'جاري التحميل...') {
        let loader = document.getElementById('global-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p class="loader-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
        }

        this.loadingCount++;
        loader.style.display = 'flex';
        loader.classList.add('active');
        document.body.classList.add('loading');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        
        if (this.loadingCount === 0) {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.remove('active');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }
            document.body.classList.remove('loading');
        }
    }

    /**
     * Show skeleton loader for content areas
     */
    showSkeleton(container, type = 'list', count = 5) {
        if (!container) return;

        container.classList.add('skeleton-loading');
        container.innerHTML = '';

        const skeletonHTML = this.getSkeletonHTML(type, count);
        container.innerHTML = skeletonHTML;
    }

    getSkeletonHTML(type, count) {
        let html = '';

        switch (type) {
            case 'list':
                for (let i = 0; i < count; i++) {
                    html += `
                        <div class="skeleton-item skeleton-list">
                            <div class="skeleton-avatar"></div>
                            <div class="skeleton-text">
                                <div class="skeleton-line short"></div>
                                <div class="skeleton-line long"></div>
                            </div>
                        </div>
                    `;
                }
                break;

            case 'cards':
                for (let i = 0; i < count; i++) {
                    html += `
                        <div class="skeleton-item skeleton-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-text">
                                <div class="skeleton-line medium"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    `;
                }
                break;

            case 'table':
                html = '<table class="skeleton-table"><tbody>';
                for (let i = 0; i < count; i++) {
                    html += `
                        <tr class="skeleton-row">
                            <td><div class="skeleton-line short"></div></td>
                            <td><div class="skeleton-line medium"></div></td>
                            <td><div class="skeleton-line medium"></div></td>
                            <td><div class="skeleton-line short"></div></td>
                        </tr>
                    `;
                }
                html += '</tbody></table>';
                break;

            case 'stats':
                for (let i = 0; i < 4; i++) {
                    html += `
                        <div class="skeleton-item skeleton-stat">
                            <div class="skeleton-icon"></div>
                            <div class="skeleton-value"></div>
                            <div class="skeleton-label"></div>
                        </div>
                    `;
                }
                break;
        }

        return html;
    }

    /**
     * Hide skeleton and show content with fade-in animation
     */
    hideSkeleton(container, contentHTML) {
        if (!container) return;

        container.innerHTML = contentHTML;
        container.classList.remove('skeleton-loading');
        container.classList.add('fade-in-content');

        setTimeout(() => {
            container.classList.remove('fade-in-content');
        }, 500);
    }

    /**
     * Show toast notification
     */
    showToast(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000,
            position = 'top-right',
            dismissible = true,
            icon = null
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-${position}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon || icons[type]}"></i>
                <div class="toast-body">
                    ${title ? `<h4 class="toast-title">${title}</h4>` : ''}
                    <p class="toast-message">${message}</p>
                </div>
                ${dismissible ? '<button class="toast-close">&times;</button>' : ''}
            </div>
            <div class="toast-progress"></div>
        `;

        // Add to container or create one
        let container = document.querySelector(`.toast-container-${position}`);
        if (!container) {
            container = document.createElement('div');
            container.className = `toast-container toast-container-${position}`;
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.removeToast(toast));
        }

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    /**
     * Remove toast notification
     */
    removeToast(toast) {
        if (!toast) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            toast.remove();
            
            // Remove container if empty
            const container = toast.parentElement;
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }

    /**
     * Clear all toasts
     */
    clearToasts(position = 'all') {
        if (position === 'all') {
            document.querySelectorAll('.toast-container').forEach(container => {
                container.innerHTML = '';
            });
        } else {
            const container = document.querySelector(`.toast-container-${position}`);
            if (container) container.innerHTML = '';
        }
    }

    /**
     * Setup page transition effects
     */
    setupPageTransitions() {
        // Add transition class to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('page-transition');
        }

        // Handle navigation clicks
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            
            // Skip external links and anchors
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
                return;
            }

            link.addEventListener('click', (e) => {
                if (!link.target || link.target === '_self') {
                    this.handlePageTransition(href);
                }
            });
        });
    }

    handlePageTransition(href) {
        const mainContent = document.querySelector('.main-content');
        
        if (mainContent) {
            mainContent.classList.add('page-leaving');
            
            setTimeout(() => {
                window.location.href = href;
            }, 300);
            
            e.preventDefault();
        }
    }

    /**
     * Apply theme styles
     */
    applyTheme() {
        const theme = localStorage.getItem('theme') || 'blue';
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Change theme with animation
     */
    changeTheme(newTheme) {
        const themes = ['blue', 'green', 'purple', 'orange', 'red', 'teal', 'slate'];
        
        if (!themes.includes(newTheme)) {
            console.warn(`Theme '${newTheme}' not found`);
            return;
        }

        // Add transition effect
        document.body.classList.add('theme-changing');
        
        setTimeout(() => {
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            setTimeout(() => {
                document.body.classList.remove('theme-changing');
            }, 500);
        }, 250);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: newTheme } }));
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast({
                type: 'success',
                title: 'متصل بالإنترنت',
                message: 'تم استعادة الاتصال بالخادم',
                duration: 3000
            });
        });

        window.addEventListener('offline', () => {
            this.showToast({
                type: 'warning',
                title: 'غير متصل',
                message: 'لا يوجد اتصال بالإنترنت. بعض الميزات قد لا تعمل.',
                duration: 0,
                dismissible: false
            });
        });

        // Handle visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('tab-hidden');
            } else {
                document.body.classList.remove('tab-hidden');
                
                // Refresh data when tab becomes visible
                window.dispatchEvent(new CustomEvent('tab:visible'));
            }
        });
    }

    /**
     * Animate number counter
     */
    animateCounter(element, end, duration = 1000, suffix = '') {
        const start = 0;
        const startTime = performance.now();

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeOutQuart)
            const ease = 1 - Math.pow(1 - progress, 4);
            
            const current = Math.floor(start + (end - start) * ease);
            element.textContent = current.toLocaleString() + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    /**
     * Animate elements on scroll
     */
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Confirm dialog
     */
    confirm(options = {}) {
        const {
            title = 'تأكيد',
            message = 'هل أنت متأكد من هذا الإجراء؟',
            confirmText = 'تأكيد',
            cancelText = 'إلغاء',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-overlay"></div>
                <div class="confirm-dialog">
                    <div class="confirm-icon ${type}">
                        <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'question-circle'}"></i>
                    </div>
                    <h3 class="confirm-title">${title}</h3>
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-cancel">${cancelText}</button>
                        <button class="btn btn-confirm btn-${type}">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Animate in
            setTimeout(() => modal.classList.add('show'), 10);

            const cleanup = () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            };

            modal.querySelector('.btn-cancel').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            modal.querySelector('.btn-confirm').addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            modal.querySelector('.confirm-overlay').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
        });
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text, successMessage = 'تم النسخ بنجاح') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast({
                type: 'success',
                message: successMessage,
                duration: 2000
            });
            return true;
        } catch (err) {
            this.showToast({
                type: 'error',
                message: 'فشل النسخ',
                duration: 3000
            });
            return false;
        }
    }
}

// Create global instance
window.ui = new UIComponents();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}
