# Roadmap

Prioritized by impact and implementation effort:

## Near-term (high impact, low effort)

- **Google Pay** — enable via Braintree Drop-in `googlePay: {}` option
- **Amazon Pay** — configure in Braintree Control Panel + Drop-in option
- **Enhanced course search** — full-text search with PostgreSQL `tsvector`

## Medium-term (high impact, medium effort)

- **Stripe payment gateway** — separate integration alongside Braintree (new module, Stripe SDK, PaymentIntent flow)
- **Mobile app** — API consumed by React Native or Flutter client; existing REST API is already mobile-ready
- **AI-powered recommendations** — course suggestions based on enrollment history and completed lessons
- **Instructor payouts** — automated monthly payouts to instructors via Stripe Connect or similar

## Long-term (strategic)

- **Learning paths** — curated course sequences with prerequisites and milestones
- **Community features** — discussion forums, live Q&A sessions, peer reviews
- **Gamification** — badges, leaderboards, streaks (Redis sorted sets already support this pattern)
- **Content delivery network** — CloudFront CDN in front of S3 for global video optimization
