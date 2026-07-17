import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react";
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <p className="text-sm text-[#13273f]/60">
                  {file ? file.name : "Click or drag file to upload"}
                </p>
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
                  <h3 className="font-bold text-[#13273f] mb-2">Summary</h3>
                  <p className="text-sm text-[#13273f]/80 whitespace-pre-wrap">{result.summary}</p>
                </div>
                
                {result.topics && result.topics.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#13273f] mb-2">Key Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.topics.map((t: string, i: number) => (
                        <span key={i} className="bg-[#e9d4cd]/50 text-[#13273f] text-xs px-2 py-1 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.faqs && result.faqs.length > 0 && (
                  <div>
                    <h3 className="font-bold text-[#13273f] mb-2">FAQs</h3>
                    <div className="space-y-3">
                      {result.faqs.map((faq: any, i: number) => (
                        <div key={i} className="bg-[#13273f]/5 rounded-lg p-3">
                          <p className="font-semibold text-sm text-[#13273f] mb-1">Q: {faq.question}</p>
                          <p className="text-sm text-[#13273f]/80">A: {faq.answer}</p>
                        </div>
                      ))}
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
