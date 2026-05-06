# 🔐 Environment Variables - LV BURGER

## Required Variables for Render Deployment

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NODE_ENV` | String | ✅ | Set to `production` |
| `PORT` | Number | ✅ | Set to `10000` (Render default) |
| `DATABASE_URL` | String | ✅ | MySQL connection string |
| `JWT_SECRET` | String | ✅ | Secret key for JWT (min 32 chars) |
| `VITE_APP_ID` | String | ✅ | Manus OAuth App ID |
| `OAUTH_SERVER_URL` | String | ✅ | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | String | ✅ | `https://portal.manus.im` |
| `OWNER_OPEN_ID` | String | ✅ | Owner's Manus Open ID |
| `OWNER_NAME` | String | ✅ | Owner's name |
| `BUILT_IN_FORGE_API_URL` | String | ✅ | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | String | ✅ | Manus API Key |
| `VITE_FRONTEND_FORGE_API_KEY` | String | ✅ | Frontend API Key |
| `VITE_FRONTEND_FORGE_API_URL` | String | ✅ | `https://api.manus.im` |
| `VITE_APP_TITLE` | String | ✅ | `LV BURGER` |
| `VITE_APP_LOGO` | String | ✅ | URL to logo image |
| `VITE_ANALYTICS_ENDPOINT` | String | ✅ | Analytics endpoint URL |
| `VITE_ANALYTICS_WEBSITE_ID` | String | ✅ | Analytics website ID |

---

## How to Add Variables in Render

1. **Go to your Web Service** in Render Dashboard
2. **Click "Environment"** tab
3. **Add each variable** with its value
4. **Click "Save Changes"**
5. **Render will automatically redeploy**

---

## Example DATABASE_URL

```
mysql://username:password@host.tidb.cloud:4000/database_name?sslMode=REQUIRED
```

---

## Security Notes

- ✅ Never commit `.env` files to GitHub
- ✅ Keep `JWT_SECRET` and API keys secure
- ✅ Use Render's environment variable management
- ✅ Rotate secrets regularly
- ✅ Use strong, random values for secrets

---

## Verification

After deployment, check health endpoint:

```bash
curl https://your-app.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-05-05T...",
  "uptime": 1234,
  "activeRequests": 0,
  "memory": {...},
  "database": "connected"
}
```

---

## Troubleshooting

**Error: "Cannot connect to database"**
- Check DATABASE_URL is correct
- Verify database is accessible from Render

**Error: "JWT_SECRET is required"**
- Add JWT_SECRET variable
- Must be at least 32 characters

**Error: "OAuth failed"**
- Verify VITE_APP_ID is correct
- Check OAUTH_SERVER_URL is accessible

---

## Next Steps

1. Add all variables in Render Dashboard
2. Deploy your service
3. Check `/api/health` endpoint
4. Test login functionality
5. Monitor logs for errors
