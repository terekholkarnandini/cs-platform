import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Globe,
  FileSpreadsheet,
  FileType,
  UploadCloud,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  Search,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState, useCallback, DragEvent } from "react";
import { toast } from "sonner";
import {
  getDocuments,
  uploadDocuments,
  type KnowledgeDocument,
} from "@/services/knowledgeApi";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/knowledge-base")({
  component: KnowledgeBase,
  head: () => ({ meta: [{ title: "Knowledge Base — SupportAI" }] }),
});

const ACCEPTED = ".pdf,.docx,.csv";
const ACCEPTED_TYPES = ["application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const sources = [
  { icon: FileText, label: "PDF", desc: "Upload manuals & docs" },
  { icon: Globe, label: "Website", desc: "Crawl any URL" },
  { icon: FileSpreadsheet, label: "CSV", desc: "Import structured data" },
  { icon: FileType, label: "DOCX", desc: "Word documents" },
];

const statusStyle: Record<string, string> = {
  Indexed: "bg-success-soft text-success",
  Processing: "bg-warning-soft text-warning-foreground",
  Failed: "bg-destructive/10 text-destructive",
};

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`;
}

function KnowledgeBase() {
  const { company } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = await getDocuments(company.id);
      setDocs(data);
    } catch {
      toast.error("Failed to load documents. Is the backend running?");
    }
  }, [company?.id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Filter by type
      const valid = fileArray.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase();
        return ["pdf", "docx", "csv"].includes(ext ?? "");
      });
      const invalid = fileArray.filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase();
        return !["pdf", "docx", "csv"].includes(ext ?? "");
      });

      if (invalid.length > 0) {
        toast.warning(
          `Unsupported file type: ${invalid.map((f) => f.name).join(", ")}. Only PDF, DOCX and CSV are supported.`
        );
      }

      if (valid.length === 0) return;

      setIsUploading(true);
      try {
        if (!company?.id) {
          toast.error("Company not found. Please reload and try again.");
          return;
        }
        const result = await uploadDocuments(valid, company.id);
        if (result.uploaded_files.length > 0) {
          toast.success(
            `Successfully uploaded ${result.uploaded_files.length} file${result.uploaded_files.length !== 1 ? "s" : ""}.`
          );
        }
        if (result.skipped_files.length > 0) {
          toast.warning(`Skipped unsupported files: ${result.skipped_files.join(", ")}`);
        }
        await fetchDocs();
      } catch {
        toast.error("Upload failed. Please check your connection and try again.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [fetchDocs]
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleSourceCardClick = (label: string) => {
    if (label === "Website") {
      toast.info("Website crawling will be available soon.");
      return;
    }
    if (!isUploading) fileInputRef.current?.click();
  };

  return (
    <>
      <Topbar
        title="Knowledge Base"
        subtitle="Feed your AI with company data"
        actions={
          <Button size="sm" variant="outline" className="rounded-lg">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Retrain AI
          </Button>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />

        {/* Source cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSourceCardClick(s.label)}
              disabled={isUploading && s.label !== "Website"}
              className="group text-left rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/40 hover:shadow-elegant transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold text-sm">Upload {s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Drop zone */}
        <div
          className={`rounded-2xl border-2 border-dashed bg-muted/20 p-10 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>
          <div className="mt-4 font-semibold">
            {isUploading ? "Uploading…" : "Drop files to upload"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            PDF, DOCX, CSV up to 50 MB · or paste a URL to crawl
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              className="rounded-lg"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Choose files"
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-lg"
              size="sm"
              disabled
              onClick={() => toast.info("Website crawling will be available soon.")}
            >
              Paste URL
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-border">
            <div>
              <div className="text-sm font-semibold">Uploaded documents</div>
              <div className="text-xs text-muted-foreground">{docs.length} sources</div>
            </div>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search documents" className="pl-9 h-9 rounded-lg" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10 text-sm">
                    No documents uploaded yet.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.filename}</TableCell>
                    <TableCell className="text-muted-foreground">{d.type}</TableCell>
                    <TableCell className="text-muted-foreground">{d.chunks}</TableCell>
                    <TableCell>
                      <Badge
                        className={"rounded-full " + (statusStyle[d.status] ?? "bg-muted text-muted-foreground")}
                        variant="secondary"
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(d.uploaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
