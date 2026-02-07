# Fix Shiprocket 403 Forbidden (Token request failed)

**Error you see:** `Token request failed: Request failed with status code 403` or `Cannot create shipment: No token`

**Cause:** Shiprocket does **not** allow your main account email/password for API login. You must create a separate **API user** and use those credentials in `.env`.

## Steps to fix

1. **Log in to Shiprocket**  
   https://app.shiprocket.in

2. **Open API settings**  
   **Settings** → **API** → **Configure**

3. **Create an API user**  
   - Click **Create API User** (or similar).  
   - Use an **email that is different** from your main Shiprocket login (e.g. `api@yourcompany.com` or a new Gmail).  
   - Set a password for this API user.  
   - Save.

4. **Update your backend `.env`**  
   Set these to the **API user** email and password (not your main account):

   ```env
   SHIPROCKET_EMAIL=api_user_email@example.com
   SHIPROCKET_PASSWORD=the_api_user_password
   ```

5. **Restart the backend**  
   Restart your Node server so it loads the new env.

6. **Test**  
   Place a test order. You should see `[Shiprocket] Token obtained successfully` in the logs and the order should appear in Shiprocket → Manage Orders.

## Reference

- [Shiprocket: How to create an API user](https://support.shiprocket.in/support/solutions/articles/43000604103-how-to-create-an-api-user-can-i-have-more-than-one-api-users-)
