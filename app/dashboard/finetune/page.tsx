"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PrepareResult = {
  data_count: number;
  file_path: string;
  sample: Array<{ text: string }>;
  mlx_command: string;
  usage: { input_tokens: number; output_tokens: number };
};

type CompareResult = {
  prompt: string;
  base_response: string;
  finetuned_response: string;
  base_model: string;
  finetuned_model: string;
  usage: { input_tokens: number; output_tokens: number };
};

export default function FinetunePage() {
  const [prompt, setPrompt] = useState("碳板跑鞋有什么优势？");
  const [prepareResult, setPrepareResult] = useState<PrepareResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePrepare() {
    setLoading("prepare"); setError("");
    try {
      const res = await api.invokeAgent("finetune", { action: "prepare_data" }) as PrepareResult;
      setPrepareResult(res);
    } catch (e) { setError(e instanceof Error ? e.message : "提取失败"); }
    finally { setLoading(null); }
  }

  async function handleCompare() {
    if (!prompt.trim()) return;
    setLoading("compare"); setError("");
    try {
      const res = await api.invokeAgent("finetune", { action: "compare", prompt: prompt.trim() }) as CompareResult;
      setCompareResult(res);
    } catch (e) { setError(e instanceof Error ? e.message : "对比失败"); }
    finally { setLoading(null); }
  }

  const EXAMPLES = ["碳板跑鞋有什么优势？", "如何处理客户的价格异议？", "露营帐篷怎么选？", "退货政策是什么？"];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔬 模型微调</h1>
        <p className="text-slate-500 text-sm mt-1">从平台数据提取训练集 · MLX LoRA 微调 · 对比基础 vs 微调模型效果</p>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">① 提取训练数据</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">从 ShopMind 数据库提取销售对话和客服记录，格式化为 MLX 训练集（JSONL）。</p>
          <Button onClick={handlePrepare} disabled={loading === "prepare"} variant="outline">
            {loading === "prepare" ? "提取中..." : "提取训练数据"}
          </Button>
          {prepareResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">数据量：{prepareResult.data_count} 条</Badge>
                <Badge variant="outline">{prepareResult.file_path}</Badge>
              </div>
              {prepareResult.sample.length > 0 && (
                <div className="bg-slate-50 rounded p-3 text-xs font-mono text-slate-600 max-h-20 overflow-y-auto">
                  {prepareResult.sample[0]?.text?.slice(0, 100)}...
                </div>
              )}
              <div className="bg-slate-900 rounded p-3">
                <p className="text-xs text-slate-400 mb-1">② 在终端执行微调命令：</p>
                <code className="text-xs text-green-400 break-all">{prepareResult.mlx_command}</code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">③ 效果对比（基础 vs 微调/增强模型）</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="输入测试问题..." />
            <Button onClick={handleCompare} disabled={loading === "compare" || !prompt.trim()}>
              {loading === "compare" ? "对比中..." : "对比"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {compareResult && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">基础模型</Badge>
                  <span className="text-xs text-slate-400">{compareResult.base_model}</span>
                </div>
                <div className="bg-slate-50 rounded p-3 text-sm text-slate-700 min-h-28 whitespace-pre-wrap">
                  {compareResult.base_response}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">电商专属</Badge>
                  <span className="text-xs text-slate-400">{compareResult.finetuned_model}</span>
                </div>
                <div className="bg-green-50 rounded p-3 text-sm text-slate-700 min-h-28 whitespace-pre-wrap border border-green-200">
                  {compareResult.finetuned_response}
                </div>
              </div>
              <div className="col-span-2 text-xs text-slate-400 text-right">
                Tokens: {compareResult.usage.input_tokens + compareResult.usage.output_tokens}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
