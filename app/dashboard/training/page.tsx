"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SCENARIOS = [
  { value: "product_intro",      label: "商品介绍", desc: "向客户介绍产品特点" },
  { value: "objection_handling", label: "异议处理", desc: "应对客户反对意见" },
  { value: "closing",            label: "促成成交", desc: "引导客户做出购买决定" },
];

const CUSTOMER_TYPES = [
  { value: "skeptical",       label: "挑剔型",    emoji: "🤨" },
  { value: "hesitant",        label: "犹豫型",    emoji: "😕" },
  { value: "price_sensitive", label: "价格敏感型", emoji: "💰" },
];

type Message = { role: "user" | "assistant"; content: string };
type ScoreResult = {
  scores: Record<string, number>;
  overall: number;
  summary: string;
  suggestions: string[];
  usage: { input_tokens: number; output_tokens: number };
};

const SCORE_LABELS: Record<string, string> = {
  communication: "沟通技巧",
  product_knowledge: "产品知识",
  objection_handling: "异议处理",
  closing: "成交能力",
};

export default function TrainingPage() {
  const [productName, setProductName] = useState("专业马拉松跑步鞋");
  const [scenario, setScenario] = useState("objection_handling");
  const [customerType, setCustomerType] = useState("price_sensitive");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");

  async function handleStart() {
    if (!productName.trim()) return;
    setLoading(true); setError(""); setScore(null); setMessages([]);
    try {
      const res = await api.invokeAgent("training", {
        action: "start", product_name: productName,
        scenario, customer_type: customerType,
      }) as { session_id: string; opening_message: string };
      setSessionId(res.session_id);
      setMessages([{ role: "assistant", content: res.opening_message }]);
    } catch (e) { setError(e instanceof Error ? e.message : "启动失败"); }
    finally { setLoading(false); }
  }

  async function handleChat() {
    if (!inputText.trim() || !sessionId) return;
    const userMsg = inputText.trim();
    setInputText(""); setLoading(true); setError("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    try {
      const res = await api.invokeAgent("training", {
        action: "chat", session_id: sessionId, message: userMsg,
      }) as { reply: string };
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (e) { setError(e instanceof Error ? e.message : "对话失败"); }
    finally { setLoading(false); }
  }

  async function handleEvaluate() {
    if (!sessionId) return;
    setLoading(true); setError("");
    try {
      const res = await api.invokeAgent("training", {
        action: "evaluate", session_id: sessionId,
      }) as ScoreResult;
      setScore(res);
    } catch (e) { setError(e instanceof Error ? e.message : "评分失败"); }
    finally { setLoading(false); }
  }

  const scenarioInfo = SCENARIOS.find(s => s.value === scenario);
  const customerInfo = CUSTOMER_TYPES.find(c => c.value === customerType);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🎯 销售培训</h1>
        <p className="text-slate-500 text-sm mt-1">AI 扮演客户陪你练习销售技巧，完成后获得 AI 评分</p>
      </div>

      {!sessionId ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">训练商品</label>
              <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="如：专业马拉松跑步鞋" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">训练场景</label>
              <div className="flex gap-2">
                {SCENARIOS.map(s => (
                  <button key={s.value} onClick={() => setScenario(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      scenario === s.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {scenarioInfo && <p className="text-xs text-slate-400">{scenarioInfo.desc}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">客户类型</label>
              <div className="flex gap-2">
                {CUSTOMER_TYPES.map(c => (
                  <button key={c.value} onClick={() => setCustomerType(c.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      customerType === c.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleStart} disabled={loading || !productName.trim()} className="w-full">
              {loading ? "启动中..." : "开始训练"}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Badge variant="outline">{scenarioInfo?.label}</Badge>
            <Badge variant="outline">{customerInfo?.emoji} {customerInfo?.label}</Badge>
            <span className="font-mono text-xs">{sessionId.slice(0, 8)}...</span>
            <Button size="sm" variant="ghost" onClick={() => { setSessionId(null); setMessages([]); setScore(null); }}>
              重新开始
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 h-80 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" && <span className="text-xs text-slate-400 block mb-1">{customerInfo?.emoji} AI 客户</span>}
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-slate-500">思考中...</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Input value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleChat()}
              placeholder="输入你的销售话术，按 Enter 发送..."
              disabled={loading} className="flex-1" />
            <Button onClick={handleChat} disabled={loading || !inputText.trim()}>发送</Button>
            <Button onClick={handleEvaluate} disabled={loading || messages.length < 4} variant="outline">获取评分</Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {score && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">📊 AI 评分结果</CardTitle>
                  <span className="text-2xl font-bold text-slate-800">{score.overall} <span className="text-sm font-normal text-slate-400">/ 10</span></span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(score.scores).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                      <span className="text-xs text-slate-600">{SCORE_LABELS[key] ?? key}</span>
                      <span className="font-bold text-sm">{val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-700">{score.summary}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">改进建议：</p>
                  {score.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-slate-600">• {s}</p>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-right">
                  Tokens: {score.usage.input_tokens + score.usage.output_tokens}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
