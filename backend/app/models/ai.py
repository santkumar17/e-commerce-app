from pydantic import BaseModel


class AIGenIn(BaseModel):
    title: str
    keywords: str = ""
    materials: str = ""
