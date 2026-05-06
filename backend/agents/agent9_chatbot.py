"""
Agent 9 — Trust Chatbot (WebSocket)
LangChain conversational chain exposed as a WebSocket endpoint.
"""
import os
from fastapi import WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a friendly clinical trial assistant for TrialGo.
Your role is to help patients understand the clinical trial they've been matched to.
Answer questions honestly in simple, clear language (Grade 8 reading level).
Never give personal medical advice. Always recommend consulting a doctor for medical decisions.
Be warm, empathetic, and encouraging. Keep responses concise (under 150 words).
If you don't know something, say so clearly."""


async def run_trust_chatbot(websocket: WebSocket, candidate_id: int):
    """WebSocket handler for the patient trust chatbot."""
    await websocket.accept()
    history = []

    await websocket.send_json({
        "role": "assistant",
        "content": "Hi! I'm your TrialGo assistant 👋 I'm here to answer any questions you have about the clinical trial you've been matched to. What would you like to know?",
    })

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("content", "").strip()
            if not user_message:
                continue

            history.append({"role": "user", "content": user_message})

            # Check for termination signal
            if any(kw in user_message.lower() for kw in ["i am ready to proceed", "ready to proceed", "i'm ready"]):
                await websocket.send_json({
                    "role": "assistant",
                    "content": "Wonderful! You're being redirected to the consent form. Best of luck with your trial journey! 🌟",
                    "action": "proceed_to_consent",
                })
                break

            # Generate response
            response = await _generate_response(user_message, history)
            history.append({"role": "assistant", "content": response})

            await websocket.send_json({"role": "assistant", "content": response})

    except WebSocketDisconnect:
        print(f"[Agent9] Chatbot disconnected for candidate {candidate_id}")
    except Exception as e:
        print(f"[Agent9] Error: {e}")
        try:
            await websocket.send_json({"role": "assistant", "content": "I'm having technical difficulties. Please try again shortly."})
        except Exception:
            pass


async def _generate_response(user_message: str, history: list) -> str:
    """Generate AI response using LangChain or fallback."""
    try:
        from services.llm_service import get_fallback_llm
        from langchain.schema import SystemMessage, HumanMessage, AIMessage

        llm = get_fallback_llm(model_type="fast", temperature=0.7)

        messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for msg in history[-6:]:  # last 3 turns
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

        result = await llm.ainvoke(messages)
        return result.content
    except Exception as e:
        print(f"[Agent9] LLM error: {e}")
        return _fallback_response(user_message)


def _fallback_response(message: str) -> str:
    message_lower = message.lower()
    if "risk" in message_lower:
        return "Every trial has some risks, which are fully explained in the consent document. Your safety is the top priority — you can withdraw at any time."
    if "pay" in message_lower or "cost" in message_lower or "free" in message_lower:
        return "Participation in this trial is completely free of charge. You may even receive compensation for your time."
    if "time" in message_lower or "long" in message_lower or "duration" in message_lower:
        return "Trial duration varies. The consent document has the exact timeline. Most trials have regular check-ins, not daily commitments."
    if "withdraw" in message_lower or "quit" in message_lower or "leave" in message_lower:
        return "You can withdraw from the trial at any time, for any reason, without any penalty or effect on your medical care."
    if "private" in message_lower or "data" in message_lower or "information" in message_lower:
        return "Your personal information is fully anonymised. We use a secure hash ID — no one in the trial has access to your real identity."
    return "That's a great question! I'd recommend reviewing the simplified consent summary for details, or feel free to ask me anything else."
