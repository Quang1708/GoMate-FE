import { api, apiBaseUrl, getSession } from '../services/api';

export const portalApi = (path, method = 'GET', body) => api(`/portal${path}`, {
  method, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export async function readDocument(file) {
  if (!file || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Chọn PDF, PNG hoặc JPEG tối đa 10 MB.');
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Không đọc được tệp.'));
    reader.readAsDataURL(file);
  });
  return { name: file.name, mime: file.type, base64 };
}

export async function downloadDocument(id) {
  const response = await fetch(`${apiBaseUrl}/portal/applications/${encodeURIComponent(id)}/document`, { headers: { Authorization: `Bearer ${getSession()?.accessToken}` } });
  if (!response.ok) throw new Error('Không tải được giấy tờ. Kiểm tra quyền truy cập.');
  const blob = await response.blob();
  saveBlob(blob, `document.${blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg'}`);
}
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
