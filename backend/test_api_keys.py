import os
import sys
import hashlib
import secrets
from datetime import datetime, timezone
import httpx
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("[ERROR] Supabase credentials missing in .env")
    sys.exit(1)

# We use the anon client for signup
supabase = create_client(supabase_url, supabase_key)

async def run_tests():
    print("=== STARTING API KEY AUTHENTICATION INTEGRATION TESTS ===")
    
    # 1. Sign up a new test user to obtain a valid session token
    test_id = secrets.token_hex(4)
    email = f"test_api_keys_{test_id}@example.com"
    password = "password123Secure!"
    
    print(f"[TEST] Registering new test user: {email}...")
    try:
        auth_res = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        user = auth_res.user
        session = auth_res.session
        if not user or not session:
            print("[ERROR] Auth signup succeeded but user or session is empty. Email confirmation might be required.")
            # Let's try to sign in in case they already exist, or handle this.
            # If email confirmation is required, sign_up returns a user but session may be null if auto-confirm is off.
            # In that case, let's look if we can bypass.
            # Wait, let's see if we can log in if the user exists, or let's check if the session is there.
            if not session:
                print("[WARNING] Session is null, attempting sign_in_with_password...")
                login_res = supabase.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })
                session = login_res.session
                user = login_res.user
                
        if not session:
            print("[ERROR] Could not establish a session. If email confirmation is required, we cannot test login flow automatically without it. Try using an existing user or mock.")
            sys.exit(1)
            
    except Exception as ex:
        print("[ERROR] Supabase signUp failed:", ex)
        sys.exit(1)
        
    access_token = session.access_token
    print(f"[OK] Test user registered successfully. ID: {user.id}")

    # 2. Instantiate request-scoped Supabase client simulating the front-end / logged-in user
    from supabase.client import ClientOptions
    req_supabase = create_client(
        supabase_url,
        supabase_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {access_token}"})
    )

    # 3. Create a test company for this user
    print("[TEST] Creating test company...")
    company_payload = {
        "owner_id": user.id,
        "name": f"Integration Test Company {test_id}",
        "industry": "testing",
        "company_size": "1-10",
        "integration_type": "Both",
        "onboarding_completed": True
    }
    try:
        co_res = req_supabase.table("companies").insert(company_payload).execute()
        if not co_res.data:
            raise Exception("No company data returned.")
        company = co_res.data[0]
        company_id = company["id"]
        print(f"[OK] Created company: '{company['name']}' with ID: {company_id}")
    except Exception as e:
        print("[ERROR] Failed to create test company:", e)
        # Clean up user
        sys.exit(1)

    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 4. Test API Key CRUD Endpoints
        headers_jwt = {"Authorization": f"Bearer {access_token}"}
        
        # Test A: Create API Key
        print("\n--- TEST A: Create API Key via GET/POST ---")
        try:
            res = await client.post("/api/keys", json={"name": "Prod API Key"}, headers=headers_jwt)
            print(f"POST /api/keys: status={res.status_code}")
            assert res.status_code == 200, "Should succeed with 200"
            key_data = res.data = res.json()
            plaintext_key = key_data["plaintext_key"]
            key_id = key_data["id"]
            print(f"[OK] Generated API Key: '{key_data['name']}' (ID: {key_id})")
            print(f"Plaintext Key returned: {plaintext_key}")
            assert plaintext_key.startswith("sk_live_"), "Format should start with sk_live_"
        except Exception as e:
            print(f"[FAIL] Test A failed: {e}")
            await cleanup(req_supabase, user.id)
            sys.exit(1)

        # Test B: List API Keys
        print("\n--- TEST B: List API Keys ---")
        try:
            res = await client.get("/api/keys", headers=headers_jwt)
            print(f"GET /api/keys: status={res.status_code}")
            assert res.status_code == 200
            keys_list = res.json()
            print(f"Keys found: {len(keys_list)}")
            assert any(k["id"] == key_id for k in keys_list), "Created key should be in the list"
        except Exception as e:
            print(f"[FAIL] Test B failed: {e}")

        # Test C: Use API Key in API Chat validation on /api/chat
        print("\n--- TEST C: Chat with valid API Key ---")
        chat_req = {
            "companyId": company_id,
            "message": "Hello, explain your product"
        }
        headers_apikey = {"Authorization": f"Bearer {plaintext_key}"}
        try:
            res = await client.post("/api/chat", json=chat_req, headers=headers_apikey, timeout=20.0)
            print(f"POST /api/chat: status={res.status_code}")
            print(f"Chat Response: {res.text[:200]}")
            assert res.status_code == 200, "Should successfully execute chat"
            print("[PASS] Chat using API Key completed correctly.")
        except Exception as e:
            print(f"[FAIL] Test C failed: {e}")

        # Test D: Regenerate API Key
        print("\n--- TEST D: Regenerate API Key ---")
        try:
            res = await client.post(f"/api/keys/{key_id}/regenerate", headers=headers_jwt)
            print(f"POST /api/keys/{key_id}/regenerate: status={res.status_code}")
            assert res.status_code == 200
            regen_data = res.json()
            new_plaintext_key = regen_data["plaintext_key"]
            new_key_id = regen_data["id"]
            print(f"[OK] New Regenerated API Key: {new_plaintext_key} (ID: {new_key_id})")
            
            # Verify old key is revoked
            res_old = await client.post("/api/chat", json=chat_req, headers=headers_apikey)
            print(f"POST /api/chat (old API Key): status={res_old.status_code}")
            assert res_old.status_code == 401, "Old key should be unauthorized (401)"
            
            # Verify new key works
            headers_new_apikey = {"Authorization": f"Bearer {new_plaintext_key}"}
            res_new = await client.post("/api/chat", json=chat_req, headers=headers_new_apikey)
            print(f"POST /api/chat (new API Key): status={res_new.status_code}")
            assert res_new.status_code == 200, "New regenerated key should work"
            print("[PASS] Regeneration and revocation test passed.")
        except Exception as e:
            print(f"[FAIL] Test D failed: {e}")

        # Test E: Save Webhook URL & Fetch settings
        print("\n--- TEST E: Save Webhook URL & Fetch settings ---")
        try:
            res_webhook = await client.post("/api/company/webhook", json={"webhookUrl": "https://callback.com/hook"}, headers=headers_jwt)
            print(f"POST /api/company/webhook: status={res_webhook.status_code}")
            assert res_webhook.status_code == 200
            
            res_settings = await client.get("/api/company/settings", headers=headers_jwt)
            print(f"GET /api/company/settings: status={res_settings.status_code}")
            assert res_settings.status_code == 200
            settings = res_settings.json()
            print(f"Saved Settings: {settings}")
            assert settings["webhook_url"] == "https://callback.com/hook", "Webhook URL mismatch"
            print("[PASS] Webhook URL save and settings load passed.")
        except Exception as e:
            print(f"[FAIL] Test E failed: {e}")

        # Test F: Delete API Key
        print("\n--- TEST F: Delete API Key ---")
        try:
            res_del = await client.delete(f"/api/keys/{new_key_id}", headers=headers_jwt)
            print(f"DELETE /api/keys/{new_key_id}: status={res_del.status_code}")
            assert res_del.status_code == 200
            
            # Verify key no longer works
            res_chat_del = await client.post("/api/chat", json=chat_req, headers={"Authorization": f"Bearer {new_plaintext_key}"})
            print(f"POST /api/chat (deleted key): status={res_chat_del.status_code}")
            assert res_chat_del.status_code == 401, "Deleted key should be unauthorized (401)"
            print("[PASS] Delete API key test passed.")
        except Exception as e:
            print(f"[FAIL] Test F failed: {e}")

    # 5. Cleanup
    await cleanup(req_supabase, user.id)
    print("\n=== ALL TESTS FINISHED ===")

async def cleanup(req_supabase, owner_id):
    print("\n[TEST] Cleaning up test company...")
    try:
        # Delete from companies where owner_id = owner_id. Cascade deletes API keys automatically (FK constraint).
        req_supabase.table("companies").delete().eq("owner_id", owner_id).execute()
        print("[OK] Test workspace cleaned up.")
    except Exception as e:
        print("[WARNING] Cleanup failed:", e)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_tests())
