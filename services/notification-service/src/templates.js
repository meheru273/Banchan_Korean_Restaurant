const wrap = (title, bodyHtml) => `
<!doctype html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1a1a2e;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;">FeastFleet</h1>
  </div>
  <div style="border:1px solid #eee;padding:20px;border-radius:0 0 8px 8px;">
    <h2 style="color:#16213e;">${title}</h2>
    ${bodyHtml}
  </div>
</body></html>`;

const itemRows = (items) => items.map(i =>
  `<tr><td>${i.name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:right;">£${(i.price * i.quantity).toFixed(2)}</td></tr>`
).join('');

exports.orderConfirmed = (d) => wrap('Order confirmed', `
  <p>Hi ${d.userName}, your order <strong>${d.orderNumber}</strong> is confirmed and being prepared.</p>
  <table style="width:100%;border-collapse:collapse;margin-top:10px;">
    <thead><tr style="background:#f5f5f5;"><th align="left">Item</th><th>Qty</th><th align="right">Price</th></tr></thead>
    <tbody>${itemRows(d.items)}</tbody>
    <tfoot><tr><td colspan="2"><strong>Total</strong></td><td align="right"><strong>£${d.total.toFixed(2)}</strong></td></tr></tfoot>
  </table>
  <p style="margin-top:15px;">Delivering to: ${d.deliveryAddress.line1}, ${d.deliveryAddress.postcode}</p>
`);

exports.orderCancelled = (d) => wrap('Order cancelled', `
  <p>Your order <strong>${d.orderNumber}</strong> has been cancelled.</p>
  <p>Reason: ${d.reason || 'No reason provided'}</p>
  <p>If you were charged, a refund will be processed within 3–5 business days.</p>
`);

exports.deliveryAssigned = (d) => wrap('Driver on the way', `
  <p>Your order <strong>${d.orderNumber}</strong> has been assigned to <strong>${d.driverName}</strong>.</p>
  ${d.driverPhone ? `<p>Driver phone: ${d.driverPhone}</p>` : ''}
`);

exports.deliveryCompleted = (d) => wrap('Delivered', `
  <p>Your order <strong>${d.orderNumber}</strong> has been delivered. Enjoy!</p>
`);
