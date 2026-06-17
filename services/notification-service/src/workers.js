const { createWorker, QUEUE_NAMES, EVENT_TYPES } = require('@feastfleet/shared');
const { sendEmail } = require('./mailer');
const tpl = require('./templates');

exports.startOrderWorker = () =>
  createWorker(QUEUE_NAMES.ORDER_EVENTS, async (job) => {
    const d = job.data;
    switch (job.name) {
      case EVENT_TYPES.ORDER_CONFIRMED:
        await sendEmail({ to: d.userEmail, subject: `Order confirmed - ${d.orderNumber}`, html: tpl.orderConfirmed(d) });
        break;
      case EVENT_TYPES.ORDER_CANCELLED:
        await sendEmail({ to: d.userEmail, subject: `Order cancelled - ${d.orderNumber}`, html: tpl.orderCancelled(d) });
        break;
      // ignore other order.* events (preparing, ready, etc.) — add if you want SMS-style updates
    }
  });

exports.startDeliveryWorker = () =>
  createWorker(QUEUE_NAMES.DELIVERY_EVENTS, async (job) => {
    const d = job.data;
    switch (job.name) {
      case EVENT_TYPES.DELIVERY_ASSIGNED:
        await sendEmail({ to: d.customerEmail, subject: `Driver assigned - ${d.orderNumber}`, html: tpl.deliveryAssigned(d) });
        break;
      case EVENT_TYPES.DELIVERY_COMPLETED:
        await sendEmail({ to: d.customerEmail, subject: `Delivered - ${d.orderNumber}`, html: tpl.deliveryCompleted(d) });
        break;
    }
  });
