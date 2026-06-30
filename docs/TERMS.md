# Terms & Conditions

**Last updated:** June 2026

## 1. Nature of the Service

SynapsisForge is a **personal portfolio project** created by Michelangelo Stega to demonstrate full-stack software engineering skills. It is **not a commercial service**, and no fees are charged for its use.

## 2. Data Collection & Retention

| Data type | Collected? | Retention |
|-----------|-----------|-----------|
| Email address | Yes (registration) | Max 3 hours — all data is purged by periodic cron job |
| Password | Yes (bcrypt hashed) | Same as above |
| Profile info | Yes (name, country) | Same as above |
| Course progress | Yes | Same as above |
| Payment info | **No** — only Braintree sandbox nonces (no real transactions) | N/A |
| Cookies | Yes (JWT refresh token, httpOnly) | Session duration |

## 3. Automated Reset

The entire site — including database contents (PostgreSQL, MongoDB, Redis), uploaded files (S3), and user-submitted content — is automatically reset every **3 hours**. No user data persists beyond this window.

## 4. Third-Party Services

- **AWS S3** — file storage for course videos and user uploads. All files are deleted every reset cycle.
- **Braintree** — sandbox payment gateway. No real financial transactions are processed.
- **Google & GitHub OAuth** — used for authentication convenience. No profile data is stored beyond what you provide during registration.

None of these services receive your data for their own purposes.

## 5. Your Rights (GDPR)

Under the European General Data Protection Regulation (GDPR), you have:
- **Right to access**: you can see what data the site holds about you via your profile page
- **Right to rectification**: edit your profile at any time
- **Right to erasure**: your data is automatically deleted within 3 hours; no manual request needed
- **Right to data portability**: email your data export request to the contact below

Since this is a portfolio project operating at **non-commercial scale**, these rights are fulfilled by the automatic reset cycle.

## 6. Disclaimer

This project is provided **"as is"** for demonstration purposes. There is no warranty, no uptime guarantee, and no obligation to maintain service continuity.

## 7. Contact

Michelangelo Stega  
GitHub: [@SuperPorz](https://github.com/SuperPorz)  
LinkedIn: [michelangelo-stega](https://linkedin.com/in/michelangelo-stega)
