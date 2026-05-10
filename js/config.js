/**
 * HR Pro System - Configuration Manager
 * يكتشف بيئة التشغيل تلقائياً ويضبط إعدادات API
 */

const AppConfig = (function() {
    // تحديد بيئة التشغيل
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';

    // إعدادات البيئة
    const environments = {
        development: {
            API_BASE_URL: 'http://localhost:5000/api',
            APP_NAME: 'HR Pro System (Dev)',
            DEBUG: true,
            VERSION: '1.0.0-dev'
        },
        production: {
            // سيتم استبدال هذا الرابط برابط Render الخاص بك عند النشر
            API_BASE_URL: 'https://your-app-name.onrender.com/api', 
            APP_NAME: 'HR Pro System',
            DEBUG: false,
            VERSION: '1.0.0'
        }
    };

    // اختيار البيئة الحالية
    const currentEnv = isLocalhost ? 'development' : 'production';
    const config = environments[currentEnv];

    // دالة مساعدة للتبديل اليدوي (للاختبار فقط)
    function forceEnvironment(envName) {
        if (environments[envName]) {
            console.warn(`⚠️ تم فرض البيئة: ${envName}`);
            return environments[envName];
        }
        return config;
    }

    // التحقق من صحة الاتصال
    async function checkHealth() {
        try {
            const response = await fetch(`${config.API_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ اتصال ناجح بالسيرفر:', data);
                return { success: true, data };
            } else {
                throw new Error('فشل الاتصال');
            }
        } catch (error) {
            console.error('❌ فشل الاتصال بالسيرفر:', error);
            console.warn('💡 تأكد من أن السيرفر يعمل أو أن رابط API صحيح في config.js');
            return { success: false, error: error.message };
        }
    }

    // عرض معلومات النظام في الكونسول
    function logSystemInfo() {
        console.groupCollapsed('🚀 HR Pro System Info');
        console.log('Environment:', currentEnv);
        console.log('API URL:', config.API_BASE_URL);
        console.log('App Name:', config.APP_NAME);
        console.log('Version:', config.VERSION);
        console.log('Debug Mode:', config.DEBUG);
        console.groupEnd();
    }

    // التشغيل التلقائي عند التحميل
    logSystemInfo();

    // واجهة التصدير العامة
    return {
        API_BASE_URL: config.API_BASE_URL,
        APP_NAME: config.APP_NAME,
        DEBUG: config.DEBUG,
        VERSION: config.VERSION,
        ENVIRONMENT: currentEnv,
        checkHealth,
        forceEnvironment
    };

})();

// جعل الإعدادات متاحة عالمياً
window.AppConfig = AppConfig;
