-- Manual PalmPay subscriptions use a pending state until an admin confirms payment.
-- SQLite stores subscription status as text, so no table rewrite is required.
UPDATE subscriptions SET provider = 'palmpay' WHERE provider = 'paystack';