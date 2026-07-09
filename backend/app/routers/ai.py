import uuid
import logging

from fastapi import APIRouter, HTTPException, Depends

from app.config import EMERGENT_LLM_KEY
from app.security import require_role
from app.models.ai import AIGenIn

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    AI_DESCRIPTION_AVAILABLE = True
except ImportError:
    AI_DESCRIPTION_AVAILABLE = False

log = logging.getLogger("artisan")

router = APIRouter(tags=["ai"])


@router.post("/ai/generate-description")
async def ai_generate(body: AIGenIn, user=Depends(require_role("seller"))):
    if not AI_DESCRIPTION_AVAILABLE:
        raise HTTPException(501, "AI description generation is not available in this environment")
    system_msg = (
        "You are a copywriter for a premium handmade artisan marketplace. "
        "Write warm, story-led, editorial product descriptions of 2-3 short paragraphs. "
        "Focus on craftsmanship, materials, and the artisan's care. Avoid marketing cliches."
    )
    prompt = (
        f"Product title: {body.title}\n"
        f"Materials: {body.materials or 'unspecified'}\n"
        f"Keywords: {body.keywords or 'handmade, artisan'}\n\n"
        "Write a compelling product description."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"desc-{uuid.uuid4()}",
            system_message=system_msg,
        ).with_model("openai", "gpt-4o-mini")
        parts: list[str] = []
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                parts.append(ev.content)
            elif isinstance(ev, StreamDone):
                break
        return {"description": "".join(parts).strip()}
    except Exception as e:
        log.exception("AI generation failed")
        raise HTTPException(500, f"AI generation failed: {e}")
