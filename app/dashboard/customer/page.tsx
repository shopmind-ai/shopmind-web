"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = { role: "user" | "assistant"; content: string };

const EXAMPLES = [
  "退货政策是什么？",
  "我的订单到哪了？",
  "如何申请退换货？",
  "满多少免运费？",
  "金卡会员有什么折扣？",
];

const INTENT_LABEL: Record<string, string> = {
  rag: "政策查询",
  sql: "账户查询",
  mixed: "综合查询",
  chat: "闲聊",
};

type InvokeResult = {
  answer: string;
  session_id: string;
  intent: string;
  usage: { input_tokens: number; output_tokens: number };
};

export default function CustomerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState("");
  const [lastUsage, setLastUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.invokeAgent("customer", {
        message: text,
        session_id: sessionId,
        customer_id: customerId,
      }) as InvokeResult;
      setSessionId(res.session_id);
      setLastIntent(res.intent);
      setLastUsage(res.usage);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "抱歉，服务暂时不可用，请稍后重试。" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💬 智能客服</h1>
          <p className="text-slate-500 text-sm mt-1">支持商品政策问答 · 订单物流查询 · 多轮对话</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={customerId}
            onChange={e => { setCustomerId(e.target.value); setMessages([]); setSessionId(null); }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="1">张伟 (ID: 1)</option>
            <option value="2">李娜 (ID: 2)</option>
            <option value="3">王芳 (ID: 3)</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => { setMessages([]); setSessionId(null); }}>
            清空对话
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => sendMessage(ex)}
            className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 h-96 overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm mt-8">
              点击上方示例或直接输入问题开始对话
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-slate-500">
                思考中...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="输入问题，按 Enter 发送..."
          disabled={loading}
        />
        <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
          发送
        </Button>
      </div>

      {lastIntent && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <Badge variant="secondary">{INTENT_LABEL[lastIntent] ?? lastIntent}</Badge>
          {lastUsage && (
            <span>
              Tokens: {lastUsage.input_tokens + lastUsage.output_tokens}
              （${((lastUsage.input_tokens / 1e6 * 3) + (lastUsage.output_tokens / 1e6 * 15)).toFixed(4)}）
            </span>
          )}
          {sessionId && <span className="font-mono text-slate-300">session: {sessionId.slice(0, 8)}...</span>}
        </div>
      )}
    </div>
  );
}
