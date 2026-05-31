"use client";
import { useState } from "react";
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

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">最终结果</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded p-3 max-h-80 overflow-y-auto">
                {result.result}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
