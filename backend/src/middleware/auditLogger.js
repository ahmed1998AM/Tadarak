import AuditLog from '../models/AuditLog.js';

/**
 * Middleware to log activities automatically
 */
export const logActivity = (module, action, entityType) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Capture response data
    let responseData = null;
    
    res.json = function(data) {
      responseData = data;
      return originalJson(data);
    };
    
    res.send = function(data) {
      responseData = data;
      return originalSend(data);
    };
    
    // Log after response is sent
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await AuditLog.create({
            company: req.company?._id || req.body?.company,
            user: req.user?._id,
            action,
            module,
            entityType,
            entityId: req.params?.id || responseData?.data?._id || req.body?.employee || req.body?._id,
            description: `${action} ${entityType.toLowerCase()} in ${module}`,
            changes: {
              before: req.body._oldData || null,
              after: responseData?.data || req.body
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query
            }
          });
        }
      } catch (error) {
        console.error('Failed to create audit log:', error);
      }
    });
    
    next();
  };
};

/**
 * Manual logging utility
 */
export const createAuditLog = async (data) => {
  try {
    return await AuditLog.create(data);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (companyId, filters = {}, options = {}) => {
  try {
    return await AuditLog.getLogs({ company: companyId, ...filters }, options);
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

/**
 * Get activity summary
 */
export const getActivitySummary = async (companyId, days = 7) => {
  try {
    return await AuditLog.getActivitySummary(companyId, days);
  } catch (error) {
    console.error('Failed to get activity summary:', error);
    throw error;
  }
};

export default {
  logActivity,
  createAuditLog,
  getAuditLogs,
  getActivitySummary
};
