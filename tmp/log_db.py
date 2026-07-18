import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase = create_client(supabase_url, supabase_key)

with open("tmp/db_info.txt", "w", encoding="utf-8") as f:
    f.write("Supabase URL: " + str(supabase_url) + "\n")
    
    # 1. Check api_keys table
    try:
        res1 = supabase.table("api_keys").select("*").limit(1).execute()
        f.write("api_keys exists! data: " + str(res1.data) + "\n")
    except Exception as e:
        f.write("api_keys missing or query error: " + str(e) + "\n")
        
    # 2. Check companies columns
    try:
        res2 = supabase.table("companies").select("*").limit(1).execute()
        if len(res2.data) > 0:
            f.write("companies data exists! columns: " + str(list(res2.data[0].keys())) + "\n")
        else:
            f.write("companies table empty or columns metadata unreachable\n")
    except Exception as e:
        f.write("companies query error: " + str(e) + "\n")
