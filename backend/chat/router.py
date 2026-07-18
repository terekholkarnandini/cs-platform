from fastapi import APIRouter, Header, HTTPException, status, Depends
from typing import Optional, Any
from pydantic import BaseModel, Field
import hashlib
import secrets
from datetime import datetime, timezone
import os
from supabase import create_client
from services.chat_service import ChatService, supabase

router = APIRouter()
chat_service = ChatService()

supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Admin client uses service role key to bypass RLS for backend write operations.
# Authorization is enforced in code (JWT validated, company_id verified) before any write.
if supabase_url and supabase_service_role_key:
    admin_supabase = create_client(supabase_url, supabase_service_role_key)
else:
    admin_supabase = supabase  # Fallback to anon (may hit RLS on writes)

class ChatRequest(BaseModel):
    company_id: str = Field(..., alias="companyId")
    message: str = Field(...)

    class Config:
        populate_by_name = True

class CreateKeyRequest(BaseModel):
    name: str

class UpdateWebhookRequest(BaseModel):
    webhook_url: str = Field(..., alias="webhookUrl")

    class Config:
        populate_by_name = True

async def get_chat_auth_data(authorization: Optional[str] = Header(None)):
    """
    Validate that the request has either:
    1. A valid Supabase authentication bearer token (JWT).
    2. A valid custom company API key (sk_live_...).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header."
        )
    token = authorization.split(" ")[1]
    
    if token.startswith("sk_live_"):
        # Validate API Key
        key_hash = hashlib.sha256(token.encode()).hexdigest()
        try:
            # Query active API key using admin client
            if not supabase:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Database connection is not available."
                )
                
            res = supabase.table("api_keys").select("*").eq("key_hash", key_hash).eq("status", "active").execute()
            if not res.data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or revoked API key."
                )
            api_key = res.data[0]
            company_id = api_key["company_id"]
            
            # Update last_used_at on the key
            supabase.table("api_keys").update({
                "last_used_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", api_key["id"]).execute()
            
            return {
                "auth_type": "api_key",
                "company_id": company_id,
                "api_key_id": api_key["id"]
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"API Key validation failed: {str(e)}"
            )
    else:
        # Standard Supabase JWT validation
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service is currently unavailable."
            )
            
        try:
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User is not authenticated. Invalid or expired token."
                )
            
            # Retrieve company owned by this user
            from supabase.client import ClientOptions
            req_supabase = create_client(
                supabase_url,
                supabase_key,
                options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
            )
            
            company_res = req_supabase.table("companies").select("id").execute()
            if not company_res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company profile not found for the authenticated user."
                )
            
            company_id = company_res.data[0]["id"]
            return {
                "auth_type": "jwt",
                "user": user_response.user,
                "token": token,
                "company_id": company_id
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}"
            )

@router.post("/chat")
async def chat(
    request: ChatRequest,
    auth_data: Any = Depends(get_chat_auth_data)
):
    # Validate message is not empty
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    # Validate company isolation
    if auth_data["company_id"] != request.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tenant isolation mismatch."
        )

    company_id = auth_data["company_id"]
    token = auth_data.get("token")  # Will be None for API key auth
    user_id = auth_data["user"].id if "user" in auth_data else None

    try:
        # Process the chat request via the orchestrator service
        response_data = chat_service.process_chat(
            company_id=company_id,
            message=request.message,
            token=token,
            user_id=user_id
        )
        return response_data

    except ValueError as val_err:
        # Invalid inputs or company not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except ConnectionError as conn_err:
        # ChromaDB/Supabase connections failed
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(conn_err)
        )
    except Exception as e:
        # Internal Server Errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected server error occurred: {str(e)}"
        )

@router.get("/keys")
async def list_keys(auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can manage API keys."
        )
    
    token = auth_data["token"]
    from supabase.client import ClientOptions
    req_supabase = create_client(
        supabase_url,
        supabase_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
    )
    
    res = req_supabase.table("api_keys").select("*").eq("company_id", auth_data["company_id"]).execute()
    return res.data

@router.post("/keys")
async def create_key(req: CreateKeyRequest, auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can manage API keys."
        )
    
    raw_part = secrets.token_hex(20)
    plaintext_key = f"sk_live_{raw_part}"
    key_hash = hashlib.sha256(plaintext_key.encode()).hexdigest()
    key_prefix = f"sk_live_{raw_part[:4]}"
    
    new_key = {
        "company_id": auth_data["company_id"],
        "name": req.name,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "status": "active"
    }
    
    # Use admin_supabase (service role) to bypass RLS — auth already verified above
    res = admin_supabase.table("api_keys").insert(new_key).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create API key."
        )
        
    created_key = res.data[0]
    created_key["plaintext_key"] = plaintext_key
    return created_key

@router.post("/keys/{key_id}/regenerate")
async def regenerate_key(key_id: str, auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can manage API keys."
        )
    
    # Verify this key belongs to the authenticated company before modifying
    res = admin_supabase.table("api_keys").select("*").eq("id", key_id).eq("company_id", auth_data["company_id"]).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found."
        )
        
    old_key = res.data[0]
    
    admin_supabase.table("api_keys").update({"status": "revoked"}).eq("id", key_id).execute()
    
    raw_part = secrets.token_hex(20)
    plaintext_key = f"sk_live_{raw_part}"
    key_hash = hashlib.sha256(plaintext_key.encode()).hexdigest()
    key_prefix = f"sk_live_{raw_part[:4]}"
    
    new_key = {
        "company_id": auth_data["company_id"],
        "name": old_key["name"],
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "status": "active"
    }
    
    res_new = admin_supabase.table("api_keys").insert(new_key).execute()
    if not res_new.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create new API key during regeneration."
        )
        
    created_key = res_new.data[0]
    created_key["plaintext_key"] = plaintext_key
    return created_key

@router.delete("/keys/{key_id}")
async def delete_key(key_id: str, auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can manage API keys."
        )
    
    # eq company_id enforces tenant isolation before deletion
    admin_supabase.table("api_keys").delete().eq("id", key_id).eq("company_id", auth_data["company_id"]).execute()
    return {"message": "API key successfully deleted."}

@router.post("/company/webhook")
async def update_webhook(req: UpdateWebhookRequest, auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can update webhook configuration."
        )
    
    # company_id already verified via JWT in get_chat_auth_data
    res = admin_supabase.table("companies").update({"webhook_url": req.webhook_url}).eq("id", auth_data["company_id"]).execute()
    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update webhook URL."
        )
        
    return {"message": "Webhook URL saved successfully.", "webhookUrl": req.webhook_url}

@router.get("/company/settings")
async def get_company_settings(auth_data: Any = Depends(get_chat_auth_data)):
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can get company settings."
        )
        
    token = auth_data["token"]
    from supabase.client import ClientOptions
    req_supabase = create_client(
        supabase_url,
        supabase_key,
        options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
    )
    
    res = req_supabase.table("companies").select("id, name, webhook_url").eq("id", auth_data["company_id"]).execute()
    if not res.data:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Company not found."
         )
         
    return res.data[0]
