from fastapi import APIRouter, Header, HTTPException, status, Depends
from typing import Optional, Any
from pydantic import BaseModel, Field
from services.chat_service import ChatService, supabase

router = APIRouter()
chat_service = ChatService()

class ChatRequest(BaseModel):
    company_id: str = Field(..., alias="companyId")
    message: str = Field(...)

    class Config:
        populate_by_name = True

async def get_authenticated_user(authorization: Optional[str] = Header(None)):
    """
    Validate that the request has a valid Supabase authentication bearer token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not authenticated. Missing or invalid Authorization header."
        )
    token = authorization.split(" ")[1]
    
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
        return {"user": user_response.user, "token": token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/chat")
async def chat(
    request: ChatRequest,
    auth_data: Any = Depends(get_authenticated_user)
):
    # Validate message is not empty
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    user = auth_data["user"]
    token = auth_data["token"]

    try:
        # Process the chat request via the orchestrator service
        response_data = chat_service.process_chat(
            company_id=request.company_id,
            message=request.message,
            token=token,
            user_id=user.id
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
