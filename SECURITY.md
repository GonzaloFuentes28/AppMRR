# Security Documentation

This document outlines the security measures implemented in AppMRR.

## 🔒 Security Features

### 1. **Rate Limiting**
- **Endpoint**: `/api/add-startup`
- **Limit**: 3 requests per hour per IP address
- **Protection**: Prevents spam, DoS attacks, and abuse
- **Implementation**: In-memory rate limiting (per serverless instance)
- **Headers**: Returns `Retry-After`, `X-RateLimit-*` headers

**Note**: For production with high traffic, consider upgrading to:
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis](https://upstash.com/)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)

### 2. **Input Validation & Sanitization**
All user inputs are validated and sanitized before processing:

#### App Name
- **Max length**: 100 characters
- **Sanitization**: Removes HTML tags, script injection patterns, control characters
- **Validation**: Checks for suspicious patterns

#### Website URL
- **Max length**: 500 characters
- **Validation**: Must be valid http/https URL
- **Protection**: Blocks localhost and private IP addresses (SSRF prevention)

#### Twitter Username
- **Max length**: 50 characters
- **Validation**: Alphanumeric + underscores only
- **Optional**: Can be empty

#### App Store ID
- **Max length**: 50 characters
- **Validation**: Numeric only
- **Optional**: Can be empty (if website URL provided)

#### RevenueCat Project ID
- **Min length**: 4 characters
- **Max length**: 100 characters
- **Validation**: Alphanumeric + hyphens/underscores only

#### RevenueCat API Key
- **Min length**: 10 characters
- **Max length**: 500 characters
- **Validation**: Must start with `sk_` (secret key prefix)
- **Validation**: Alphanumeric + underscores only

### 3. **XSS Protection**
- All user inputs are sanitized to remove HTML/script tags
- JavaScript injection patterns (`javascript:`, `on*=`) are removed
- Control characters and null bytes are stripped

### 4. **Data Encryption**
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64 bytes random per encryption
- **IV**: 16 bytes random per encryption
- **Authentication**: HMAC tag for integrity verification

### 5. **Row Level Security (RLS)**
Supabase RLS policies enforce access control:

#### Public Access (Publishable Key)
- ✅ **READ** startups table
- ✅ **READ** revenue_metrics table
- ❌ **WRITE** any table
- ❌ **READ** api_keys table

#### Server Access (Secret API Key)
- ✅ **Full access** to all tables (bypasses RLS)

### 6. **Environment Variables**
All sensitive data is stored in environment variables:

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_secret_api_key  # Secret API key (not publishable)
ENCRYPTION_KEY=your_encryption_key_32_bytes_min

# For cron job
CRON_SECRET=your_strong_random_secret
```

**Important**: Never use `PUBLIC_` prefix for sensitive variables in Astro.

### 7. **Server-Side Rendering (SSR)**
- **Mode**: `output: 'server'` in Astro config
- **Execution**: All sensitive operations run on server
- **Client**: Only receives rendered HTML and public data
- **API Routes**: All in `/api/` directory, server-only

### 8. **Secure Error Handling**
- Internal error details are not leaked to client
- Generic error messages for unexpected failures
- Detailed errors only for API/validation issues
- All errors logged server-side for debugging

## 🎯 Attack Vectors Mitigated

| Attack Type | Mitigation |
|-------------|------------|
| **XSS (Cross-Site Scripting)** | Input sanitization, HTML tag removal |
| **SQL Injection** | Parameterized queries (Supabase) |
| **SSRF (Server-Side Request Forgery)** | URL validation, private IP blocking |
| **DoS (Denial of Service)** | Rate limiting |
| **Data Exfiltration** | RLS policies, encryption at rest |
| **API Key Theft** | Encrypted storage, server-only access |
| **Credential Stuffing** | Rate limiting, API key validation |
| **Script Injection** | Input sanitization, pattern blocking |

## 🔍 Security Testing

### Manual Testing
1. **Test Rate Limiting**:
   ```bash
   # Should block after 3 requests
   for i in {1..5}; do
     curl -X POST https://your-domain.com/api/add-startup \
       -H "Content-Type: application/json" \
       -d '{"name":"test","projectId":"test1234","revenuecatApiKey":"sk_test","websiteUrl":"https://example.com"}'
   done
   ```

2. **Test Input Validation**:
   ```bash
   # Should reject invalid inputs
   curl -X POST https://your-domain.com/api/add-startup \
     -H "Content-Type: application/json" \
     -d '{"name":"<script>alert(1)</script>","projectId":"x","websiteUrl":"javascript:alert(1)"}'
   ```

3. **Test RLS Policies**:
   ```sql
   -- In Supabase SQL Editor with Publishable key
   SELECT * FROM api_keys; -- Should fail
   INSERT INTO startups (name) VALUES ('test'); -- Should fail
   ```

## 📋 Security Checklist

- [x] Rate limiting on public endpoints
- [x] Input validation and sanitization
- [x] XSS protection
- [x] RLS policies configured
- [x] API keys encrypted at rest (AES-256-GCM)
- [x] Environment variables secured
- [x] SSR mode enabled
- [x] Error messages don't leak internals
- [x] No secrets in client bundle
- [x] HTTPS only (enforced by Vercel)
- [x] Secure headers (CSP, X-Frame-Options, etc.)

## 🚀 Future Recommendations

### High Priority
1. **Monitor rate limit abuse**: Set up alerts for excessive rate limit violations
2. **Regular dependency updates**: Run `npm audit` weekly
3. **Key rotation**: Plan for encryption key rotation every 6-12 months
4. **Log monitoring**: Review logs for suspicious patterns

### Medium Priority
1. **Upgrade rate limiting**: Use Vercel KV or Upstash for distributed rate limiting
2. **Add CAPTCHA**: Consider adding reCAPTCHA for signup form
3. **Content Security Policy**: Add stricter CSP headers
4. **Security headers**: Add additional security headers (HSTS, etc.)

### Nice to Have
1. **WAF (Web Application Firewall)**: Cloudflare or similar
2. **DDoS protection**: Cloudflare or Vercel Pro
3. **Security scanning**: Automated vulnerability scanning
4. **Penetration testing**: Annual professional security audit

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email: [gonzalofsv@gmail.com]

**DO NOT** create public issues for security vulnerabilities.

