"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Step = {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

type ClusterResult = {
  job_id: string;
  result: string;
  agents_called: string[];
  steps: Step[];
  usage: { input_tokens: number; output_tokens: number };
};

const TOOL_LABELS: Record<string, string> = {
  data_cleaning:        "🧹 数据清洗",
  customer_service:     "💬 智能客服",
  media_library_search: "🖼️ 素材库",
  social_media:         "✍️ 内容创作",
  live_clip:            "✂️ 直播切片",
  sales_training:       "🎯 销售培训",
};

const EXAMPLES = [
  "帮我生成一篇关于马拉松跑鞋的小红书种草文案",
  "在素材库中搜索户外露营相关图片",
  "回答：退货政策是什么？",
  "先搜索跑步装备图片，再生成一篇小红书文案",
];

export default function ClusterPage() {
  const [task, setTask] = useState("");
  const [result, setResult] = useState<ClusterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("cluster_result");
    if (saved) { try { setResult(JSON.parse(saved)); } catch {} }
  }, []);
  useEffect(() => {
    if (result) sessionStorage.setItem("cluster_result", JSON.stringify(result));
  }, [result]);

  async function handleRun() {
    if (!task.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await api.invokeAgent("cluster", { task: task.trim(), context: {} }) as ClusterResult;
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "执行失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    {/* Lightbox overlay */}
    {lightbox && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-zoom-out"
        onClick={() => setLightbox(null)}
      >
        <button
          className="absolute top-4 right-4 text-white text-2xl leading-none bg-black/40 rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/70"
          onClick={() => setLightbox(null)}
        >
          ✕
        </button>
        <img
          src={lightbox}
          alt="预览"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🤖 集群指挥</h1>
        <p className="text-slate-500 text-sm mt-1">用自然语言描述任务，AI 自动调度最合适的 Agent 完成</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => setTask(ex)}
            className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            {ex}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder="描述你想完成的任务，例如：先清洗商品数据，然后生成小红书文案..."
            rows={4}
            className="resize-none"
          />
          <Button onClick={handleRun} disabled={loading || !task.trim()} className="w-full">
            {loading ? "AI 正在调度执行中（约15-60秒）..." : "🚀 执行任务"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap text-sm text-slate-500">
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{result.job_id.slice(0, 8)}...</span>
            {result.agents_called.map(a => (
              <Badge key={a} variant="secondary" className="text-xs">{TOOL_LABELS[a] ?? a}</Badge>
            ))}
            <span>Tokens: {result.usage.input_tokens + result.usage.output_tokens}</span>
          </div>

          {result.steps.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">执行日志（{result.steps.length} 步）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.steps.map((step, i) => (
                  <div key={i} className="bg-slate-50 rounded p-3 text-xs font-mono">
                    <span className="text-slate-500">Step {i + 1}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="text-blue-600">{TOOL_LABELS[step.tool] ?? step.tool}</span>
                    <span className="ml-2 text-slate-400">{JSON.stringify(step.input).slice(0, 80)}...</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Render media images from steps when media_library_search was called */}
          {result.steps.some(s => s.tool === "media_library_search") && (() => {
            const mediaSteps = result.steps.filter(s => s.tool === "media_library_search");
            const images: Array<{ asset_id: string; image_url: string; description: string; score: number }> = [];
            mediaSteps.forEach(s => {
              const out = s.output as { results?: typeof images };
              if (out.results) images.push(...out.results);
            });
            // Deduplicate by asset_id
            const seen = new Set<string>();
            const unique = images.filter(img => {
              if (seen.has(img.asset_id)) return false;
              seen.add(img.asset_id);
              return true;
            });
            return unique.length > 0 ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">素材库检索结果（{unique.length} 张）</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {unique.map((img) => (
                      <div key={img.asset_id} className="space-y-1">
                        <img
                          src={img.image_url}
                          alt={img.description}
                          className="w-full h-32 object-cover rounded bg-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => setLightbox(img.image_url)}
                          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/200x150?text=Image"; }}
                        />
                        <p className="text-xs text-slate-500 line-clamp-1">{img.description}</p>
                        <p className="text-xs text-slate-400">{(img.score * 100).toFixed(0)}% 匹配</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">最终结果</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-slate-50 rounded p-3 max-h-80 overflow-y-auto
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
                [&_a]:text-blue-600 [&_a]:underline
                [&_hr]:my-2 [&_strong]:font-semibold
                [&_ul]:pl-4 [&_li]:my-0.5 text-slate-700">
                <ReactMarkdown>{result.result}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
