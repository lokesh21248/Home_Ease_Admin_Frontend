/**
 * System Configurations and Roles
 */

export const ADMIN_ROLES = [
  { id: 'super_admin', name: 'Super Admin / Platform Executive', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'ops_manager', name: 'Operations & Dispatch Manager', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'kyc_lead', name: 'Trust, Safety & Compliance Lead', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'catalog_manager', name: 'Catalog & Marketing Manager', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

export const DEFAULT_SECURITY_SETTINGS = {
  jwtExpiration: '8 Hours',
  twoFactorMandatory: true,
  maxFailedLogins: 5,
  ipWhitelist: '',
  apiKeys: [],
  securityLogs: []
};
