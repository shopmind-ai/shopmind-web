"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAMPLE = JSON.stringify([
  { name: "  跑步鞋 Nike  ", price: "￥299", category: "鞋子", stock: "true", sku: "NK-001" },
  { name: "Camping Tent", price: "$89.99", category: "outdoor gear", stock: "50", sku: "CT-010" },
  { name: "", price: "199", category: "运动", stock: "10", sku: "XX-000" },
], null, 2);

type CleanResult = {
  cleaned_data: unknown[];
  report: Record<string, unknown>;
  usage: { input_tokens: number; output_tokens: number };
};

export default function CleaningPage() {
  const [input, setInput] = useState(SAMPLE);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("cleaning_result");
    if (saved) { try { setResult(JSON.parse(saved)); } catch {} }
  }, []);
  useEffect(() => {
    if (result) sessionStorage.setItem("cleaning_result", JSON.stringify(result));
  }, [result]);

  async function handleClean() {
    setLoading(true);
    setError("");
    try {
      const data = JSON.parse(input);
      const res = await api.invokeAgent("cleaning", { data, data_type: "products" }) as CleanResult;
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🧹 数据清洗中心</h1>
        <p className="text-slate-500 text-sm mt-1">粘贴原始商品数据（JSON 数组），AI 自动识别并修复质量问题</p>
      </div>

      <Card>
        <CardHeader><CardTitle>输入数据</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
          <Button onClick={handleClean} disabled={loading}>
            {loading ? "清洗中..." : "开始清洗"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader><CardTitle>清洗报告</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{String(result.report.total_input)}</p>
                  <p className="text-slate-500 text-sm">原始记录</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{String(result.report.valid_count)}</p>
                  <p className="text-slate-500 text-sm">清洗通过</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{String(result.report.invalid_count)}</p>
                  <p className="text-slate-500 text-sm">无法修复</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400 text-right">
                Token 消耗：{result.usage.input_tokens + result.usage.output_tokens}
                （${((result.usage.input_tokens / 1e6 * 3) + (result.usage.output_tokens / 1e6 * 15)).toFixed(4)}）
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>清洗后数据（{result.cleaned_data.length} 条）</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-slate-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(result.cleaned_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
