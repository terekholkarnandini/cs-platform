import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

print("URL:", supabase_url)
print("Anon Key exists:", bool(supabase_key))

try:
    supabase = create_client(supabase_url, supabase_key)
except Exception as ex:
    print("Init client failed:", ex)
    sys.exit(1)

# Let's try to query the api_keys table to see if it already exists
try:
    res = supabase.table("api_keys").select("*").limit(1).execute()
    print("api_keys table exists! Query response:", res.data)
except Exception as e:
    print("api_keys table check failed:", type(e), e)

# Let's try to check the companies columns
try:
    res = supabase.table("companies").select("id").limit(1).execute()
    print("companies table check. Data:", res.data)
except Exception as e:
    print("companies table check failed:", type(e), e)
