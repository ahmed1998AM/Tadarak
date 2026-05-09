/**
 * HR Pro System - SaaS Subscription Module
 * Handles subscription plans, billing, and multi-tenancy
 */

class SaaSService {
    constructor() {
        this.api = window.api;
        this.ui = window.ui;
        
        this.plans = {
            free: {
                id: 'free',
                name: 'مجاني',
                nameEn: 'Free',
                price: 0,
                currency: 'USD',
                features: [
                    'حتى 5 موظفين',
                    'إدارة المهام الأساسية',
                    'تقارير محدودة',
                    'دعم عبر البريد الإلكتروني',
                    '1 جيجابايت تخزين'
                ],
                limitations: {
                    maxEmployees: 5,
                    maxUsers: 2,
                    storageGB: 1,
                    apiCallsPerDay: 1000
                }
            },
            starter: {
                id: 'starter',
                name: 'مبتدئ',
                nameEn: 'Starter',
                price: 29,
                currency: 'USD',
                billingPeriod: 'month',
                features: [
                    'حتى 25 موظف',
                    'جميع وحدات النظام',
                    'تقارير متقدمة',
                    'دعم فني 24/7',
                    '10 جيجابايت تخزين',
                    'تكامل مع Google Calendar',
                    'نسخ احتياطي يومي'
                ],
                limitations: {
                    maxEmployees: 25,
                    maxUsers: 5,
                    storageGB: 10,
                    apiCallsPerDay: 10000
                },
                popular: true
            },
            professional: {
                id: 'professional',
                name: 'احترافي',
                nameEn: 'Professional',
                price: 79,
                currency: 'USD',
                billingPeriod: 'month',
                features: [
                    'حتى 100 موظف',
                    'جميع ميزات مبتدئ',
                    'لوحة تحكم مخصصة',
                    'API كامل الوصول',
                    '50 جيجابايت تخزين',
                    'تكاملات متعددة',
                    'تدريب للموظفين',
                    'مدير حساب مخصص'
                ],
                limitations: {
                    maxEmployees: 100,
                    maxUsers: 15,
                    storageGB: 50,
                    apiCallsPerDay: 100000
                }
            },
            enterprise: {
                id: 'enterprise',
                name: 'مؤسسات',
                nameEn: 'Enterprise',
                price: null,
                currency: 'USD',
                billingPeriod: 'custom',
                features: [
                    'عدد غير محدود من الموظفين',
                    'جميع ميزات احترافي',
                    'نشر خاص (On-Premise)',
                    'تخصيص كامل',
                    'تخزين غير محدود',
                    'دعم VIP',
                    'SLA 99.9%',
                    'تدقيق أمني'
                ],
                limitations: {
                    maxEmployees: Infinity,
                    maxUsers: Infinity,
                    storageGB: Infinity,
                    apiCallsPerDay: Infinity
                },
                contactSales: true
            }
        };

        this.init();
    }

    init() {
        this.checkSubscriptionStatus();
        this.setupEventListeners();
    }

    /**
     * Check current subscription status
     */
    async checkSubscriptionStatus() {
        try {
            const subscription = await this.api.get('/subscriptions/status');
            this.currentSubscription = subscription;
            this.updateUI(subscription);
            return subscription;
        } catch (error) {
            console.error('Failed to check subscription:', error);
            return null;
        }
    }

    /**
     * Update UI based on subscription
     */
    updateUI(subscription) {
        if (!subscription) return;

        // Update plan badge in header
        const planBadge = document.querySelector('.subscription-badge');
        if (planBadge) {
            const plan = this.plans[subscription.planId];
            planBadge.textContent = plan?.name || subscription.planId;
            planBadge.className = `subscription-badge badge-${subscription.planId}`;
        }

        // Show/hide features based on plan
        this.applyPlanRestrictions(subscription);

        // Show upgrade prompts if needed
        this.showUpgradePrompts(subscription);
    }

    /**
     * Apply plan restrictions to UI
     */
    applyPlanRestrictions(subscription) {
        const plan = this.plans[subscription.planId];
        if (!plan) return;

        // Hide premium features for free plan
        if (subscription.planId === 'free') {
            document.querySelectorAll('[data-requires-plan]').forEach(el => {
                const requiredPlan = el.dataset.requiresPlan;
                const allowedPlans = ['starter', 'professional', 'enterprise'];
                
                if (!allowedPlans.includes(requiredPlan)) {
                    el.style.display = 'none';
                }
            });
        }

        // Update usage indicators
        this.updateUsageIndicators(subscription.usage, plan.limitations);
    }

    /**
     * Update usage indicators
     */
    updateUsageIndicators(usage, limitations) {
        // Employees count
        const employeesIndicator = document.querySelector('#employees-usage');
        if (employeesIndicator && usage.employees !== undefined) {
            const percentage = (usage.employees / limitations.maxEmployees) * 100;
            employeesIndicator.innerHTML = `
                <div class="usage-bar">
                    <div class="usage-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="usage-text">${usage.employees} / ${limitations.maxEmployees} موظف</span>
            `;
            
            if (percentage > 90) {
                employeesIndicator.classList.add('warning');
            }
        }

        // Storage
        const storageIndicator = document.querySelector('#storage-usage');
        if (storageIndicator && usage.storage !== undefined) {
            const percentage = (usage.storage / limitations.storageGB) * 100;
            storageIndicator.innerHTML = `
                <div class="usage-bar">
                    <div class="usage-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="usage-text">${usage.storage.toFixed(1)} / ${limitations.storageGB} جيجابايت</span>
            `;
        }
    }

    /**
     * Show upgrade prompts
     */
    showUpgradePrompts(subscription) {
        if (subscription.planId !== 'free') return;

        // Show upgrade banner on dashboard
        const dashboard = document.querySelector('.dashboard-container');
        if (dashboard && !document.querySelector('.upgrade-banner')) {
            const banner = document.createElement('div');
            banner.className = 'upgrade-banner';
            banner.innerHTML = `
                <div class="banner-content">
                    <i class="fas fa-rocket"></i>
                    <span>احصل على ميزات إضافية بالترقية إلى خطة أعلى</span>
                    <button class="btn btn-primary" onclick="window.saas.showPlans()">ترقية الآن</button>
                </div>
                <button class="banner-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            dashboard.insertBefore(banner, dashboard.firstChild);
        }
    }

    /**
     * Show pricing plans modal
     */
    showPlans() {
        const modal = document.createElement('div');
        modal.className = 'pricing-modal';
        modal.innerHTML = this.getPricingModalHTML();
        document.body.appendChild(modal);

        setTimeout(() => modal.classList.add('show'), 10);

        // Close handlers
        modal.querySelector('.modal-close').addEventListener('click', () => this.closePlans(modal));
        modal.querySelector('.modal-overlay').addEventListener('click', () => this.closePlans(modal));
    }

    closePlans(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    getPricingModalHTML() {
        const plans = Object.values(this.plans);
        
        return `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>اختر الخطة المناسبة لك</h2>
                    <p>خطط مرنة تناسب جميع الاحتياجات</p>
                    <button class="modal-close">&times;</button>
                </div>
                
                <div class="pricing-grid">
                    ${plans.map(plan => this.getPlanCardHTML(plan)).join('')}
                </div>
                
                <div class="pricing-footer">
                    <p>جميع الخطط تشمل ضمان استرجاع الأموال لمدة 14 يوم</p>
                    <p>هل تحتاج مساعدة في الاختيار؟ <a href="#contact">تواصل معنا</a></p>
                </div>
            </div>
        `;
    }

    getPlanCardHTML(plan) {
        const isPopular = plan.popular ? 'popular' : '';
        const priceDisplay = plan.price ? `$${plan.price}/${plan.billingPeriod}` : 'تواصل للبيع';
        
        return `
            <div class="plan-card ${plan.id} ${isPopular}">
                ${plan.popular ? '<div class="popular-badge">الأكثر شعبية</div>' : ''}
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-price">
                        <span class="price">${priceDisplay}</span>
                    </div>
                </div>
                
                <ul class="plan-features">
                    ${plan.features.map(feature => `
                        <li><i class="fas fa-check"></i> ${feature}</li>
                    `).join('')}
                </ul>
                
                <div class="plan-action">
                    <button class="btn btn-${plan.contactSales ? 'outline' : 'primary'}" 
                            onclick="window.saas.selectPlan('${plan.id}')">
                        ${plan.contactSales ? 'تواصل للمبيعات' : 'ابدأ الآن'}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Select a plan
     */
    async selectPlan(planId) {
        const plan = this.plans[planId];
        
        if (plan.contactSales) {
            window.location.href = '/contact-sales.html';
            return;
        }

        try {
            this.ui.showLoading('جاري التجهيز...');
            
            // Create subscription session
            const session = await this.api.post('/subscriptions/create-session', {
                planId,
                successUrl: window.location.origin + '/subscription/success',
                cancelUrl: window.location.origin + '/subscription/cancel'
            });

            // Redirect to payment
            if (session.url) {
                window.location.href = session.url;
            } else {
                this.ui.showToast({
                    type: 'success',
                    title: 'تم الاشتراك',
                    message: `تم تفعيل خطة ${plan.name} بنجاح`,
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Failed to create subscription:', error);
            this.ui.showToast({
                type: 'error',
                title: 'خطأ',
                message: error.message || 'حدث خطأ أثناء الاشتراك',
                duration: 5000
            });
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(reason = '') {
        const confirmed = await this.ui.confirm({
            title: 'إلغاء الاشتراك',
            message: 'هل أنت متأكد من إلغاء اشتراكك؟ سيتم إيقاف الميزات المدفوعة في نهاية الفترة الحالية.',
            confirmText: 'نعم، إلغاء',
            cancelText: 'تراجع',
            type: 'warning'
        });

        if (!confirmed) return;

        try {
            this.ui.showLoading('جاري الإلغاء...');
            
            await this.api.post('/subscriptions/cancel', { reason });
            
            this.ui.showToast({
                type: 'success',
                title: 'تم الإلغاء',
                message: 'تم إلغاء اشتراكك بنجاح',
                duration: 3000
            });

            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            this.ui.showToast({
                type: 'error',
                title: 'خطأ',
                message: error.message || 'حدث خطأ أثناء الإلغاء',
                duration: 5000
            });
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Upgrade/downgrade plan
     */
    async changePlan(newPlanId) {
        const currentPlan = this.currentSubscription?.planId;
        const newPlan = this.plans[newPlanId];
        
        if (!newPlan) {
            throw new Error('الخطة غير موجودة');
        }

        try {
            this.ui.showLoading('جاري تغيير الخطة...');
            
            const result = await this.api.post('/subscriptions/change-plan', {
                newPlanId,
                prorate: true
            });

            this.ui.showToast({
                type: 'success',
                title: 'تم التغيير',
                message: `تم الترقية إلى خطة ${newPlan.name} بنجاح`,
                duration: 3000
            });

            this.checkSubscriptionStatus();
            return result;
        } catch (error) {
            console.error('Failed to change plan:', error);
            throw error;
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Get company usage stats
     */
    async getCompanyUsage() {
        try {
            const usage = await this.api.get('/companies/usage');
            return usage;
        } catch (error) {
            console.error('Failed to get usage:', error);
            return null;
        }
    }

    /**
     * Invite team member
     */
    async inviteMember(email, role) {
        const subscription = this.currentSubscription;
        const plan = this.plans[subscription?.planId];

        // Check if within user limit
        if (subscription?.usersCount >= plan?.limitations.maxUsers) {
            this.ui.showToast({
                type: 'warning',
                title: 'حد المستخدمين',
                message: `لقد وصلت إلى الحد الأقصى للمستخدمين (${plan.limitations.maxUsers}). يرجى الترقية لزيادة الحد.`,
                duration: 5000
            });
            return false;
        }

        try {
            await this.api.post('/companies/invite', { email, role });
            
            this.ui.showToast({
                type: 'success',
                title: 'تم الإرسال',
                message: 'تم إرسال دعوة الانضمام للفريق',
                duration: 3000
            });
            
            return true;
        } catch (error) {
            console.error('Failed to invite member:', error);
            this.ui.showToast({
                type: 'error',
                title: 'خطأ',
                message: error.message || 'حدث خطأ أثناء إرسال الدعوة',
                duration: 5000
            });
            return false;
        }
    }

    /**
     * Check feature availability
     */
    canAccessFeature(featureName) {
        const subscription = this.currentSubscription;
        if (!subscription) return false;

        const featureMap = {
            'advanced_reports': ['starter', 'professional', 'enterprise'],
            'api_access': ['professional', 'enterprise'],
            'custom_branding': ['professional', 'enterprise'],
            'priority_support': ['starter', 'professional', 'enterprise'],
            'sso_integration': ['enterprise'],
            'audit_logs': ['professional', 'enterprise']
        };

        const requiredPlans = featureMap[featureName];
        if (!requiredPlans) return true; // Feature available in all plans

        return requiredPlans.includes(subscription.planId);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.saas = new SaaSService();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaaSService;
}
