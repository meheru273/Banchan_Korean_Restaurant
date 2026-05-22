const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

const DELIVERY_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  EN_ROUTE: 'en_route',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  DRIVER: 'driver',
};

const QUEUE_NAMES = {
  ORDER_EVENTS: 'order-events',
  DELIVERY_EVENTS: 'delivery-events',
  NOTIFICATION_JOBS: 'notification-jobs',
};

const EVENT_TYPES = {
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_CANCELLED: 'order.cancelled',
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_PICKED_UP: 'delivery.picked_up',
  DELIVERY_EN_ROUTE: 'delivery.en_route',
  DELIVERY_COMPLETED: 'delivery.completed',
  DELIVERY_FAILED: 'delivery.failed',
  SEND_EMAIL: 'send.email',
};

module.exports = {
  ORDER_STATUS,
  DELIVERY_STATUS,
  USER_ROLES,
  QUEUE_NAMES,
  EVENT_TYPES,
};
