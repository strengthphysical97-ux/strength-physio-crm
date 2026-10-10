# Strength Physio CRM — Company Handover

## Production setup
1. Copy `.env.example` to `.env`.
2. Set `MONGO_URL` to the production MongoDB database.
3. Set a long random `JWT_SECRET`.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://SERVER:PORT/`.

## Business rules
- **Total Sale** = amount already paid by the customer (`amountPaid`).
- **Pending** = `totalAmount - amountPaid`.
- Payment status is derived automatically: Pending, Partial, or Paid.
- No receiver/payment-history workflow is required in the UI.
- Admin can see all staff data and filter reports by staff.
- Staff can access only their assigned leads/customers/orders/performance.
- Reports use the exact selected calendar dates, inclusive of both From and To.
- Reports provide both order-level CSV and date-wise daily CSV exports.

## Important handover checks
- Use a production HTTPS reverse proxy (Nginx/Cloudflare/etc.).
- Keep `.env` out of source control.
- Back up MongoDB before deployment and before schema/data changes.
- Create at least one admin account with `create-admin.js`; change any temporary credentials immediately.


## Sales source and customer history update
- Orders now store lead source, content/campaign type, and campaign name.
- Orders page has a source filter and customer history shortcut.
- Customer history summarizes total orders, billing, paid, pending, order details, and payment timeline.
- New payment increments are recorded when the order total paid amount increases. Legacy orders without itemized payment history show their saved total as a legacy record.
- GST is locked on edit; delivery charge remains editable.
