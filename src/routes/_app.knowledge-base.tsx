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

export const Route = createFileRoute("/_app/knowledge-base")({
  component: KnowledgeBase,
  head: () => ({ meta: [{ title: "Knowledge Base — SupportAI" }] }),
});

const sources = [
  { icon: FileText, label: "PDF", desc: "Upload manuals & docs" },
  { icon: Globe, label: "Website", desc: "Crawl any URL" },
  { icon: FileSpreadsheet, label: "CSV", desc: "Import structured data" },
  { icon: FileType, label: "DOCX", desc: "Word documents" },
];

const docs = [
  { name: "product-manual-v3.pdf", type: "PDF", size: "2.4 MB", status: "Indexed", updated: "2h ago" },
  { name: "warranty-terms-2024.pdf", type: "PDF", size: "812 KB", status: "Indexed", updated: "1d ago" },
  { name: "shipping-faq.docx", type: "DOCX", size: "156 KB", status: "Indexed", updated: "3d ago" },
  { name: "product-catalog.csv", type: "CSV", size: "1.1 MB", status: "Processing", updated: "just now" },
  { name: "help.acme.com", type: "Website", size: "428 pages", status: "Indexed", updated: "5d ago" },
  { name: "return-policy-2024.pdf", type: "PDF", size: "342 KB", status: "Failed", updated: "1w ago" },
];

const statusStyle: Record<string, string> = {
  Indexed: "bg-success-soft text-success",
  Processing: "bg-warning-soft text-warning-foreground",
  Failed: "bg-destructive/10 text-destructive",
};

function KnowledgeBase() {
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
        {/* Source cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((s) => (
            <button
              key={s.label}
              className="group text-left rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/40 hover:shadow-elegant transition-all"
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
        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="mt-4 font-semibold">Drop files to upload</div>
          <div className="mt-1 text-sm text-muted-foreground">
            PDF, DOCX, CSV up to 50 MB · or paste a URL to crawl
          </div>
          <div className="mt-5 flex justify-center gap-2">
            <Button className="rounded-lg" size="sm">Choose files</Button>
            <Button variant="outline" className="rounded-lg" size="sm">Paste URL</Button>
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
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.type}</TableCell>
                  <TableCell className="text-muted-foreground">{d.size}</TableCell>
                  <TableCell>
                    <Badge className={"rounded-full " + statusStyle[d.status]} variant="secondary">
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.updated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
