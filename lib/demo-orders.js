export const demoOrdersKey = 'tabletalkDemoOrders';

export function readDemoOrders() {
  if (typeof window === 'undefined') return [];
  try {
    const orders = JSON.parse(window.localStorage.getItem(demoOrdersKey) || '[]');
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

export function saveDemoOrders(orders) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(demoOrdersKey, JSON.stringify(orders));
  window.dispatchEvent(new Event('tabletalk-demo-orders-updated'));
}
