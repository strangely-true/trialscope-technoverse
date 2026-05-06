import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

def get_fallback_llm(model_type: str = "fast", temperature: float = 0.3):
    """
    Returns a LangChain LLM that attempts Gemini first, falls back to Groq, and then to OpenAI.
    """
    # 1. Gemini
    # Ensure google api key is set or passing it. Let's assume GOOGLE_API_KEY is in env.
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview" if model_type == "fast" else "gemini-3.1-flash-lite",
        temperature=temperature,
        google_api_key=os.getenv("GOOGLE_API_KEY", ""),
        max_retries=1
    )

    # 2. Groq
    groq_llm = ChatGroq(
        model="llama3-8b-8192" if model_type == "fast" else "llama3-70b-8192",
        temperature=temperature,
        api_key=os.getenv("GROQ_API_KEY", ""),
        max_retries=1
    )

    # 3. OpenAI
    openai_llm = ChatOpenAI(
        model="gpt-3.5-turbo" if model_type == "fast" else "gpt-4-turbo",
        temperature=temperature,
        api_key=os.getenv("OPENAI_API_KEY", ""),
        max_retries=1
    )

    # Create the fallback chain
    fallback_llm = gemini_llm.with_fallbacks([groq_llm, openai_llm])
    
    return fallback_llm

def invoke_llm_chain(system_prompt: str, human_prompt: str, input_vars: dict, model_type: str = "fast", temperature: float = 0.3):
    """
    Convenience method to invoke the fallback chain.
    """
    llm = get_fallback_llm(model_type, temperature)
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", human_prompt),
    ])
    chain = prompt | llm
    return chain.invoke(input_vars)
