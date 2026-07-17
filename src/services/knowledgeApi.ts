const BASE_URL = "http://localhost:8000";

export interface KnowledgeDocument {
  id: string;
  company_id: string;
  filename: string;
  type: string;
  chunks: number;
  status: string;
  uploaded_at: string;
}

export interface UploadResponse {
  message: string;
  uploaded_files: KnowledgeDocument[];
  skipped_files: string[];
}

export async function getDocuments(company_id: string): Promise<KnowledgeDocument[]> {
  const res = await fetch(`${BASE_URL}/knowledge/documents?company_id=${encodeURIComponent(company_id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadDocuments(files: File[], company_id: string): Promise<UploadResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("company_id", company_id);
  const res = await fetch(`${BASE_URL}/knowledge/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  return res.json();
}
