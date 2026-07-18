"""
Widget router — GET/PATCH settings, public config, embeddable script w.js, and iframe chat
All queries scoped to company isolation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field
from typing import Any, Optional
import os
import re
import logging
from uuid import UUID

# Set up logging
logger = logging.getLogger(__name__)

# Re-use auth and DB dependencies
from chat.router import get_chat_auth_data, admin_supabase
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

# ─── Pydantic schemas ────────────────────────────────────────────────────────

class WidgetSettingsSchema(BaseModel):
    widget_color: str = Field(default="#10B981")
    widget_greeting: str = Field(default="Hi there! 👋 How can I help you today?")
    widget_position: str = Field(default="br")
    widget_theme: str = Field(default="light")
    widget_title: Optional[str] = None
    logo_url: Optional[str] = None

class PublicChatRequest(BaseModel):
    workspace: str
    message: str


# ─── Internal helpers ────────────────────────────────────────────────────────

def _clean_slug(name: str) -> str:
    """Standardise slug format: lowercase, replace spaces/specials with hiphens."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def _resolve_company(workspace: str) -> Optional[dict]:
    """Find company by ID (UUID) or name slug."""
    if not workspace:
        return None

    # Try UUID
    try:
        UUID(workspace)
        res = admin_supabase.table("companies").select("*").eq("id", workspace).execute()
        if res.data:
            return res.data[0]
    except ValueError:
        pass

    # Try slug matching
    res = admin_supabase.table("companies").select("*").execute()
    slug_in = _clean_slug(workspace)
    for row in (res.data or []):
        if _clean_slug(row.get("name", "")) == slug_in:
            return row
        # Direct name match fallback
        if row.get("name", "").lower() == workspace.lower():
            return row

    # Try key_hash check (if API prefix is passed as workspace)
    key_hash = workspace.strip()
    if key_hash:
        try:
            # Check api_keys table
            key_res = admin_supabase.table("api_keys").select("company_id").eq("key_hash", key_hash).eq("status", "active").execute()
            if key_res.data:
                comp_id = key_res.data[0]["company_id"]
                comp_res = admin_supabase.table("companies").select("*").eq("id", comp_id).execute()
                if comp_res.data:
                    return comp_res.data[0]
        except Exception:
            pass

    return None


# ─── Authenticated Settings Endpoints ─────────────────────────────────────────

@router.get("/companies/me/widget")
async def get_my_widget(auth_data: Any = Depends(get_chat_auth_data)):
    """Fetch widget settings for the authenticated company."""
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can access widget settings."
        )
    company_id = auth_data["company_id"]
    res = admin_supabase.table("companies").select(
        "id, name, logo_url, widget_color, widget_greeting, widget_position, widget_theme, widget_title"
    ).eq("id", company_id).execute()

    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    return res.data[0]


@router.patch("/companies/me/widget")
async def update_my_widget(settings: WidgetSettingsSchema, auth_data: Any = Depends(get_chat_auth_data)):
    """Update widget settings for the authenticated company."""
    if auth_data["auth_type"] != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only session users can modify widget settings."
        )
    company_id = auth_data["company_id"]

    update_payload = {
        "widget_color": settings.widget_color,
        "widget_greeting": settings.widget_greeting,
        "widget_position": settings.widget_position,
        "widget_theme": settings.widget_theme,
        "widget_title": settings.widget_title,
    }
    if settings.logo_url is not None:
        update_payload["logo_url"] = settings.logo_url

    res = admin_supabase.table("companies").update(update_payload).eq("id", company_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update widget settings.")

    return res.data[0]


# ─── Public Widget endpoints ─────────────────────────────────────────────────

@router.get("/widget/config")
async def get_public_widget_config(workspace: str = Query(..., description="Workspace ID (UUID) or Name slug")):
    """Public details used by embedded widget wrapper."""
    company = _resolve_company(workspace)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found or invalid workspace")

    company_id = company["id"]

    # Load matching documents count, business rules, and generative config
    doc_res = admin_supabase.table("companies").select("id").execute() # dummy or files list
    rules_res = admin_supabase.table("business_rules").select("*").eq("company_id", company_id).execute()
    rules = rules_res.data[0] if rules_res.data else {}

    ai_res = admin_supabase.table("ai_configuration").select("*").eq("company_id", company_id).execute()
    ai_config = ai_res.data[0] if ai_res.data else {}

    return {
        "company": {
            "id": company_id,
            "name": company["name"],
            "logo_url": company.get("logo_url"),
            "widget_color": company.get("widget_color") or "#10B981",
            "widget_greeting": company.get("widget_greeting") or "Hi there! 👋 How can I help you today?",
            "widget_position": company.get("widget_position") or "br",
            "widget_theme": company.get("widget_theme") or "light",
            "widget_title": company.get("widget_title") or f"{company['name']} Support",
        },
        "business_rules": {
            "refund_enabled": rules.get("refund_enabled", False),
            "replacement_enabled": rules.get("replacement_enabled", False),
            "warranty_enabled": rules.get("warranty_enabled", False),
            "escalation_enabled": rules.get("escalation_enabled", False),
            "working_hours": f"{rules.get('working_start', '')} - {rules.get('working_end', '')}" if rules.get("working_start") else "24/7",
        },
        "ai_config": {
            "confidence_threshold": ai_config.get("confidence_threshold", 0.50),
            "response_style": ai_config.get("response_style", "Professional"),
        }
    }


@router.get("/widget/w.js")
async def get_widget_script(workspace: Optional[str] = Query(None, description="Workspace ID or Slug")):
    """Generates and serves the vanilla js widgets loader script."""
    # Find hosting URL dynamically
    host = os.getenv("WIDGET_HOST_URL", "http://localhost:8000")

    js_code = f"""(function() {{
    let workspace = "{workspace or ''}";
    const host = "{host}";

    if (!workspace) {{
        const scriptEl = document.currentScript || document.querySelector('script[data-workspace]');
        if (scriptEl) {{
            workspace = scriptEl.getAttribute('data-workspace') || '';
        }}
    }}

    if (!workspace) {{
        console.error("[SupportAI Widget] Missing workspace identifier");
        return;
    }}

    // Fetch config
    fetch(host + "/api/widget/config?workspace=" + encodeURIComponent(workspace))
        .then(r => r.json())
        .then(data => {{
            if (!data.company) return;
            initWidget(data.company);
        }})
        .catch(err => console.error("[SupportAI Widget] Init error:", err));

    function initWidget(company) {{
        // Styles
        const style = document.createElement("style");
        style.innerHTML = `
            .supportai-bubble {{
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: ${{company.widget_color}};
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                transition: transform 0.2s;
            }}
            .supportai-bubble:hover {{
                transform: scale(1.05);
            }}
            .supportai-container {{
                position: fixed;
                bottom: 96px;
                right: 24px;
                width: 380px;
                height: 480px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 999999;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }}
            .supportai-container.open {{
                display: flex;
            }}
            .supportai-iframe {{
                width: 100%;
                height: 100%;
                border: 0;
            }}
            @media (max-width: 480px) {{
                .supportai-container {{
                    bottom: 0 !important;
                    right: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                }}
            }}
        `;
        document.head.appendChild(style);

        // Adjust position dynamically
        if (company.widget_position === "bl") {{
            style.innerHTML += `
                .supportai-bubble {{ left: 24px; right: auto; }}
                .supportai-container {{ left: 24px; right: auto; }}
            `;
        }} else if (company.widget_position === "tl") {{
            style.innerHTML += `
                .supportai-bubble {{ top: 24px; bottom: auto; left: 24px; right: auto; }}
                .supportai-container {{ top: 96px; bottom: auto; left: 24px; right: auto; }}
            `;
        }} else if (company.widget_position === "tr") {{
            style.innerHTML += `
                .supportai-bubble {{ top: 24px; bottom: auto; right: 24px; }}
                .supportai-container {{ top: 96px; bottom: auto; right: 24px; }}
            `;
        }}

        // Create bubble
        const bubble = document.createElement("div");
        bubble.className = "supportai-bubble";
        bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        document.body.appendChild(bubble);

        // Create container
        const container = document.createElement("div");
        container.className = "supportai-container";
        const iframe = document.createElement("iframe");
        iframe.className = "supportai-iframe";
        iframe.src = host + "/api/widget/iframe?workspace=" + encodeURIComponent(workspace);
        container.appendChild(iframe);
        document.body.appendChild(container);

        // Click actions
        bubble.addEventListener("click", () => {{
            container.classList.toggle("open");
            if (container.classList.contains("open")) {{
                bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            }} else {{
                bubble.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            }}
        }});
    }}
    }})();"""

    return Response(content=js_code, media_type="application/javascript")


@router.get("/widget/iframe")
async def get_widget_iframe(workspace: str = Query(..., description="Workspace slug or company UUID")):
    """Serves the standalone chat widget template."""
    company = _resolve_company(workspace)
    if not company:
        return HTMLResponse("<html><body>Company not found</body></html>", status_code=404)

    color = company.get("widget_color") or "#10B981"
    name = company.get("widget_title") or f"{company['name']} Support"
    greeting = company.get("widget_greeting") or "Hi there! 👋 How can I help you today?"
    logo_val = company.get("logo_url") or ""

    # Generate complete self-contained chat client page
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Widget</title>
    <!-- Outfit Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{
            font-family: 'Outfit', sans-serif;
        }}
        ::-webkit-scrollbar {{
            width: 5px;
        }}
        ::-webkit-scrollbar-track {{
            background: transparent;
        }}
        ::-webkit-scrollbar-thumb {{
            background: #cbd5e1;
            border-radius: 4px;
        }}
    </style>
</head>
<body class="bg-slate-50 flex flex-col h-screen select-none">
    <!-- Header -->
    <div class="px-4 py-3 flex items-center justify-between text-white shadow-md relative shrink-0" style="background-color: {color};">
        <div class="flex items-center gap-3">
            <div class="h-9 w-9 bg-white/20 rounded-full overflow-hidden flex items-center justify-center font-bold">
                {f'<img src="{logo_val}" class="w-full h-full object-cover"/>' if logo_val else '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>'}
            </div>
            <div>
                <h3 class="font-semibold text-sm">{name}</h3>
                <p class="text-[10px] opacity-90 flex items-center gap-1">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> AI online · responds instantly
                </p>
            </div>
        </div>
    </div>

    <!-- Messages -->
    <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        <!-- AI Greeting -->
        <div class="flex gap-2 max-w-[85%]">
            <div class="w-7 h-7 rounded-lg text-white grid place-items-center font-semibold text-xs shrink-0 select-none" style="background-color: {color};">
                AI
            </div>
            <div class="bg-slate-100 text-slate-800 text-xs px-3 py-2.5 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-wrap">
                {greeting}
            </div>
        </div>
    </div>

    <!-- Input footer -->
    <form id="chat-form" class="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
        <input 
            type="text" 
            id="chat-input"
            autocomplete="off"
            placeholder="Type your message..."
            class="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-slate-400 transition-colors"
        />
        <button 
            type="submit" 
            class="h-8 w-8 grid place-items-center text-white rounded-lg hover:scale-105 active:scale-95 transition-all outline-none shrink-0" 
            style="background-color: {color};"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
        </button>
    </form>

    <script>
        const companyId = "{company['id']}";
        const chatMessages = document.getElementById("chat-messages");
        const chatForm = document.getElementById("chat-form");
        const chatInput = document.getElementById("chat-input");

        function addMessage(role, content) {{
            const div = document.createElement("div");
            div.className = "flex gap-2 max-w-[85%] " + (role === "user" ? "ml-auto flex-row-reverse" : "");
            
            const avatar = role === 'user' 
                ? '' 
                : `<div class="w-7 h-7 rounded-lg text-white grid place-items-center font-semibold text-xs shrink-0 select-none" style="background-color: {color};">AI</div>`;

            const bodyClass = role === 'user'
                ? "bg-slate-800 text-white rounded-tr-sm"
                : "bg-slate-100 text-slate-800 rounded-tl-sm";

            div.innerHTML = `
                ${{avatar}}
                <div class="${{bodyClass}} text-xs px-3 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap">
                    ${{content}}
                </div>
            `;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }}

        chatForm.addEventListener("submit", (e) => {{
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage("user", text);
            chatInput.value = "";

            // Show typing indicator
            const typingDiv = document.createElement("div");
            typingDiv.className = "flex gap-2 max-w-[85%] typing-indicator";
            typingDiv.innerHTML = `
                <div class="w-7 h-7 rounded-lg text-white grid place-items-center font-semibold text-xs shrink-0 select-none animate-pulse" style="background-color: {color};">AI</div>
                <div class="bg-slate-100 text-slate-400 text-xs px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1 leading-relaxed">
                    <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: -0.3s"></span>
                    <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: -0.15s"></span>
                    <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Call POST /api/widget/chat
            fetch("/api/widget/chat", {{
                method: "POST",
                headers: {{ "Content-Type": "application/json" }},
                body: JSON.stringify({{ workspace: companyId, message: text }})
            }})
            .then(res => res.json())
            .then(data => {{
                // Remove indicator
                typingDiv.remove();
                addMessage("assistant", data.answer || "Sorry, I encountered an error.");
            }})
            .catch(err => {{
                typingDiv.remove();
                addMessage("assistant", "We are currently experiencing connection issue. Re-trying soon.");
                console.error(err);
            }});
        }});
    </script>
</body>
</html>"""

    return HTMLResponse(content=html_content)


@router.post("/widget/chat")
async def post_widget_chat(req: PublicChatRequest):
    """Stateless public endpoint executing company RAG chat pipeline."""
    company = _resolve_company(req.workspace)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found or invalid workspace context")

    company_id = company["id"]

    try:
        # Run standard prompt matching & Gemini chat pipeline
        response_data = chat_service.process_chat(
            company_id=company_id,
            message=req.message,
            token=None,
            user_id=None
        )
        return response_data
    except Exception as e:
        logger.error(f"[Widget Chat] Error processing chat: {e}")
        # Graceful fallback response configuration
        return {
            "answer": "I'm sorry, I couldn't process your request right now. Please test again shortly."
        }
