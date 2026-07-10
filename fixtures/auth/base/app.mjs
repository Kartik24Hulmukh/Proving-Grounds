export function canExportCsv(user) {
  return user.role === 'admin' && user.authenticated === true;
}
