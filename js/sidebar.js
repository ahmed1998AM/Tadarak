/**
 * HR Pro System - Enhanced Sidebar Component
 * Advanced sidebar with smooth animations, collapsible sections, and permission-based visibility
 */

class EnhancedSidebar {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtn = document.querySelector('.sidebar-toggle');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.menuItems = document.querySelectorAll('.menu-item');
        this.subMenus = document.querySelectorAll('.submenu');
        this.isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        this.currentTheme = localStorage.getItem('theme') || 'blue';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applySavedState();
        this.setupKeyboardShortcuts();
        this.animateMenuItems();
    }

    setupEventListeners() {
        // Toggle button click
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Overlay click to close
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }

        // Submenu toggles
        document.querySelectorAll('.has-submenu > .menu-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleSubmenuToggle(e));
        });

        // Active menu item highlighting
        this.highlightCurrentMenu();

        // Mouse enter/leave for collapsed state
        if (this.sidebar) {
            this.sidebar.addEventListener('mouseenter', () => {
                if (this.isCollapsed && window.innerWidth > 768) {
                    this.expandTemporarily();
                }
            });

            this.sidebar.addEventListener('mouseleave', () => {
                if (this.isCollapsed && window.innerWidth > 768) {
                    this.collapseTemporarily();
                }
            });
        }

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    toggle() {
        if (!this.sidebar) return;

        this.isCollapsed = !this.isCollapsed;
        this.sidebar.classList.toggle('collapsed', this.isCollapsed);
        this.sidebar.classList.toggle('expanded', !this.isCollapsed);
        
        // Save state
        localStorage.setItem('sidebar_collapsed', this.isCollapsed);

        // Animate
        this.animateToggle();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('sidebar:toggled', { 
            detail: { collapsed: this.isCollapsed } 
        }));
    }

    collapse() {
        if (!this.sidebar || this.isCollapsed) return;
        this.toggle();
    }

    expand() {
        if (!this.sidebar || !this.isCollapsed) return;
        this.toggle();
    }

    close() {
        if (window.innerWidth <= 768) {
            this.collapse();
        }
    }

    handleResize() {
        if (window.innerWidth <= 768) {
            this.sidebar?.classList.add('mobile');
            if (!this.isCollapsed) {
                this.collapse();
            }
        } else {
            this.sidebar?.classList.remove('mobile');
            this.applySavedState();
        }
    }

    applySavedState() {
        if (!this.sidebar) return;

        if (this.isCollapsed && window.innerWidth > 768) {
            this.sidebar.classList.add('collapsed');
        }

        if (window.innerWidth <= 768) {
            this.sidebar.classList.add('mobile');
        }
    }

    handleSubmenuToggle(e) {
        e.preventDefault();
        
        const parent = e.target.closest('.has-submenu');
        const submenu = parent?.querySelector('.submenu');
        
        if (!submenu) return;

        // Close other submenus (accordion effect)
        if (parent.parentElement.classList.contains('menu')) {
            document.querySelectorAll('.menu > .has-submenu.open').forEach(openItem => {
                if (openItem !== parent) {
                    openItem.classList.remove('open');
                    openItem.querySelector('.submenu').style.maxHeight = '0';
                }
            });
        }

        // Toggle current submenu
        parent.classList.toggle('open');
        
        if (parent.classList.contains('open')) {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
        } else {
            submenu.style.maxHeight = '0';
        }

        // Save expanded submenu state
        this.saveSubmenuState(parent.classList.contains('open'));
    }

    saveSubmenuState(isOpen) {
        const expandedSubmenus = JSON.parse(localStorage.getItem('expanded_submenus') || '[]');
        
        if (isOpen) {
            // Add to expanded list (avoid duplicates)
            event.target.closest('.has-submenu').id && 
                !expandedSubmenus.includes(event.target.closest('.has-submenu').id) &&
                expandedSubmenus.push(event.target.closest('.has-submenu').id);
        } else {
            // Remove from expanded list
            const id = event.target.closest('.has-submenu').id;
            const index = expandedSubmenus.indexOf(id);
            if (index > -1) {
                expandedSubmenus.splice(index, 1);
            }
        }
        
        localStorage.setItem('expanded_submenus', JSON.stringify(expandedSubmenus));
    }

    restoreSubmenuState() {
        const expandedSubmenus = JSON.parse(localStorage.getItem('expanded_submenus') || '[]');
        
        expandedSubmenus.forEach(id => {
            const submenu = document.getElementById(id)?.querySelector('.submenu');
            if (submenu) {
                const parent = submenu.closest('.has-submenu');
                parent?.classList.add('open');
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
            }
        });
    }

    animateToggle() {
        if (!this.sidebar) return;

        // Add animation class
        this.sidebar.classList.add('animating');
        
        setTimeout(() => {
            this.sidebar.classList.remove('animating');
        }, 300);
    }

    animateMenuItems() {
        this.menuItems.forEach((item, index) => {
            item.style.transitionDelay = `${index * 50}ms`;
            item.classList.add('fade-in');
        });
    }

    highlightCurrentMenu() {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        
        this.menuItems.forEach(item => {
            const link = item.querySelector('.menu-link');
            const href = link?.getAttribute('href');
            
            if (href === currentPage || (currentPage === '' && href === 'dashboard.html')) {
                item.classList.add('active');
                
                // Open parent submenu if exists
                const parentSubmenu = item.closest('.submenu');
                if (parentSubmenu) {
                    parentSubmenu.style.maxHeight = parentSubmenu.scrollHeight + 'px';
                    parentSubmenu.parentElement.classList.add('open');
                }
            }
        });
    }

    expandTemporarily() {
        if (!this.sidebar) return;
        this.sidebar.classList.add('temp-expand');
    }

    collapseTemporarily() {
        if (!this.sidebar) return;
        this.sidebar.classList.remove('temp-expand');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggle();
            }

            // Escape to close sidebar on mobile
            if (e.key === 'Escape' && window.innerWidth <= 768 && !this.isCollapsed) {
                this.collapse();
            }
        });
    }

    /**
     * Apply permissions to menu items
     */
    applyPermissions(userRole) {
        if (!window.rbac || !userRole) return;

        this.menuItems.forEach(item => {
            const permission = item.dataset.permission;
            
            if (permission) {
                const permissions = permission.split(',').map(p => p.trim());
                const hasAccess = window.rbac.canAny(userRole, permissions);
                
                if (!hasAccess) {
                    item.style.display = 'none';
                    item.classList.add('restricted');
                } else {
                    item.style.display = '';
                    item.classList.remove('restricted');
                }
            }
        });

        // Hide empty menu sections
        document.querySelectorAll('.menu-section').forEach(section => {
            const visibleItems = section.querySelectorAll('.menu-item:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                section.style.display = 'none';
            }
        });
    }

    /**
     * Update user info in sidebar
     */
    updateUserInfo(user) {
        const userNameEl = document.querySelector('.user-info .user-name');
        const userRoleEl = document.querySelector('.user-info .user-role');
        const userAvatarEl = document.querySelector('.user-avatar');

        if (userNameEl) userNameEl.textContent = user?.name || 'مستخدم';
        if (userRoleEl) userRoleEl.textContent = window.rbac?.getRoleInfo(user?.role)?.name || user?.role || 'موظف';
        if (userAvatarEl && user?.name) {
            userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
        }
    }

    /**
     * Add notification badge to menu item
     */
    addNotificationBadge(menuItemId, count) {
        const menuItem = document.getElementById(menuItemId);
        if (!menuItem) return;

        let badge = menuItem.querySelector('.notification-badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                menuItem.querySelector('.menu-link').appendChild(badge);
            }
            
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
            
            // Add pulse animation for new notifications
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 2000);
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Set active menu item programmatically
     */
    setActiveMenu(itemId) {
        this.menuItems.forEach(item => item.classList.remove('active'));
        
        const targetItem = document.getElementById(itemId);
        if (targetItem) {
            targetItem.classList.add('active');
            
            // Scroll into view if needed
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new EnhancedSidebar();
    
    // Apply permissions after sidebar initialization
    if (window.api?.isAuthenticated()) {
        const user = window.api.getCurrentUser();
        if (user && window.sidebar) {
            window.sidebar.applyPermissions(user.role);
            window.sidebar.updateUserInfo(user);
        }
    }
});
