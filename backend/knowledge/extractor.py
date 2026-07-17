from pypdf import PdfReader
from docx import Document
import pandas as pd
import os


def extract_text(file_path: str):

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif ext == ".docx":
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])

    elif ext == ".csv":
        df = pd.read_csv(file_path)
        return df.to_string(index=False)

    else:
        raise ValueError("Unsupported file type")