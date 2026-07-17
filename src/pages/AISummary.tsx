import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AISummary() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!text && !file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/ai-summary", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setResult(data);
      } else {
        alert("Error: " + (data.detail || "Unknown error"));
      }
    } catch (e) {
      alert("Failed to connect to backend");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#13273f]">AI Summary</h1>
        <p className="text-[#13273f]/60 text-base">Upload a document or paste text to generate an academic summary.</p>
      </div>

      <div className="flex flex-col gap-8">
        <Card className="glass-card border-[#e9d4cd]">
          <CardHeader>
            <CardTitle className="text-xl text-[#13273f]">Input Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#13273f]/80 mb-2">Paste Text</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full bg-[#13273f]/5 border border-[#13273f]/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f]/20"
                placeholder="Paste your long academic text here..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-[#13273f]/10"></div>
              <span className="text-xs text-[#13273f]/40 font-bold uppercase">OR</span>
              <div className="flex-1 h-[1px] bg-[#13273f]/10"></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#13273f]/80 mb-2">Upload File (PDF/Image)</label>
              <div className="border-2 border-dashed border-[#13273f]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#13273f]/5 transition-colors relative">
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".pdf,image/*"
                />
                <Upload className="w-8 h-8 text-[#13273f]/40 mb-2" />
                {file ? (
                  <div className="flex items-center gap-2 mt-2 z-10 relative">
                    <p className="text-sm text-[#13273f] font-medium">{file.name}</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFile(null);
                        // Also reset the file input value so we can upload the same file again if needed
                        const fileInput = e.currentTarget.closest('.border-dashed')?.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#13273f]/60 mt-2">Click or drag file to upload</p>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || (!text && !file)}
              className="w-full bg-[#13273f] text-white hover:bg-[#193656]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate Summary
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <Card className="glass-card border-[#e9d4cd]">
              <CardHeader>
                <CardTitle className="text-xl text-[#13273f]">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-[#13273f] mb-3">Summary</h3>
                  {(() => {
                    if (typeof result.summary === 'string') {
                      return <p className="text-sm text-[#13273f]/80 whitespace-pre-wrap leading-relaxed">{result.summary}</p>;
                    }
                    if (typeof result.summary === 'object' && result.summary !== null) {
                      const textContent = result.summary.text || result.summary.summary || result.summary.content || result.summary.description;
                      if (textContent && typeof textContent === 'string') {
                        return <p className="text-sm text-[#13273f]/80 whitespace-pre-wrap leading-relaxed">{textContent}</p>;
                      }
                      return (
                        <ul className="list-disc pl-5 space-y-3 text-sm text-[#13273f]/80">
                          {Object.entries(result.summary).map(([key, value]) => (
                            <li key={key}>
                              <strong className="text-[#13273f] capitalize">{key.replace(/_/g, ' ')}:</strong> {String(value)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {Array.isArray(result.topics) && result.topics.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#13273f] mb-2">Key Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.topics.map((t: any, i: number) => {
                        let topicName = t;
                        let topicDesc = "";
                        if (typeof t === 'object' && t !== null) {
                          topicName = t.name || t.topic || t.title || Object.values(t)[0];
                          topicDesc = t.description || t.detail || t.summary || "";
                        }
                        return (
                          <span 
                            key={i} 
                            className="bg-[#e9d4cd]/50 text-[#13273f] text-xs px-3 py-1.5 rounded-md font-medium"
                            title={topicDesc}
                          >
                            {typeof topicName === 'string' ? topicName : JSON.stringify(topicName)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {Array.isArray(result.faqs) && result.faqs.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#13273f] mb-2">FAQs</h3>
                    <div className="space-y-3">
                      {result.faqs.map((faq: any, i: number) => {
                        let q = faq?.question || faq?.q;
                        let a = faq?.answer || faq?.a;
                        if (!q && typeof faq === 'object' && faq !== null) {
                          q = Object.keys(faq)[0];
                          a = Object.values(faq)[0];
                        }
                        return (
                          <div key={i} className="bg-[#13273f]/5 rounded-lg p-4">
                            <p className="font-semibold text-sm text-[#13273f] mb-1">Q: {String(q || "No question")}</p>
                            <p className="text-sm text-[#13273f]/80">A: {String(a || "No answer")}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
