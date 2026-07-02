import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client

# Carrega o .env do diretório raiz do projeto, mesmo se o backend for iniciado dentro da pasta backend
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / '.env'
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")

SUPABASE_KEY = SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="SheTech Secure Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class RegisterRequest(BaseModel):
    nome_completo: str
    nome_usuario: str
    email: EmailStr
    senha: str


def _clean_user(user: dict):
    if not user:
        return None
    user.pop("senha", None)
    return user


@app.post("/api/login")
async def login(payload: LoginRequest):
    response = supabase.table("users").select("*").eq("email", payload.email).maybe_single().execute()
    if response.error:
        raise HTTPException(status_code=500, detail="Erro ao consultar usuário no banco")

    user = response.data
    if not user or user.get("senha") != payload.senha:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    return {"user": _clean_user(user)}


@app.post("/api/register")
async def register(payload: RegisterRequest):
    existing_email = supabase.table("users").select("email").eq("email", payload.email).maybe_single().execute()
    if existing_email.error:
        raise HTTPException(status_code=500, detail="Erro ao consultar usuários existentes")
    if existing_email.data:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    existing_username = supabase.table("users").select("nome_usuario").eq("nome_usuario", payload.nome_usuario).maybe_single().execute()
    if existing_username.error:
        raise HTTPException(status_code=500, detail="Erro ao consultar usuários existentes")
    if existing_username.data:
        raise HTTPException(status_code=400, detail="Nome de usuário já cadastrado")

    insert_payload = {
        "nome_completo": payload.nome_completo,
        "nome_usuario": payload.nome_usuario,
        "email": payload.email,
        "senha": payload.senha,
        "data_cadastro": datetime.utcnow().isoformat(),
        "foto_perfil": "",
        "bio": "",
        "habilidades": [],
        "experiencia": []
    }

    created = supabase.table("users").insert(insert_payload).execute()
    if created.error:
        raise HTTPException(status_code=500, detail="Erro ao cadastrar usuário no banco")

    created_user = created.data
    if isinstance(created_user, list) and created_user:
        created_user = created_user[0]

    return {"user": _clean_user(created_user)}
