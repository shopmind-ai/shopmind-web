"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PLATFORMS = [
  { value: "xiaohongshu", label: "小红书", emoji: "📕" },
  { value: "douyin",      label: "抖音",   emoji: "🎵" },
  { value: "wechat",      label: "公众号", emoji: "💬" },
];

const TONES = ["种草", "专业", "活泼"];

type ImageSuggestion = {
  asset_id: string;
  image_url: string;
  category: string;
  description: string;
  score: number;
};

type SocialResult = {
  title: string;
  content: string;
  hashtags: string[];
  suggested_images: ImageSuggestion[];
  platform: string;
  usage: { input_tokens: number; output_tokens: number };
};

export default function SocialPage() {
  const [productName, setProductName] = useState("专业马拉松跑步鞋");
  const [platform, setPlatform] = useState("xiaohongshu");
  const [tone, setTone] = useState("种草");
  const [features, setFeatures] = useState("碳纤维中底, 轻量, 红色");
  const [result, setResult] = useState<SocialResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!productName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const keyFeatures = features.split(",").map(s => s.trim()).filter(Boolean);
      const res = await api.invokeAgent("social", {
        product_name: productName.trim(),
        platform,
        tone,
        key_features: keyFeatures,
      }) as SocialResult;
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const currentPlatform = PLATFORMS.find(p => p.value === platform);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">✍️ 内容创作</h1>
        <p className="text-slate-500 text-sm mt-1">输入商品信息，AI 自动生成平台定制文案 · 联动素材库推荐配图</p>
      </div>

      {/* 输入区 */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">商品名称</label>
              <Input
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="如：专业马拉松跑步鞋"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">主要特点（逗号分隔）</label>
              <Input
                value={features}
                onChange={e => setFeatures(e.target.value)}
                placeholder="碳纤维中底, 轻量, 红色"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium">发布平台</label>
              <div className="flex gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      platform === p.value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">内容基调</label>
              <div className="flex gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      tone === t
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !productName.trim()}
            className="w-full"
          >
            {loading
              ? "生成中（约15-30秒）..."
              : `生成 ${currentPlatform?.emoji} ${currentPlatform?.label} 文案`}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {/* 结果区 */}
      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {currentPlatform?.emoji} {currentPlatform?.label} 文案
                </CardTitle>
                <span className="text-xs text-slate-400">
                  Tokens: {result.usage.input_tokens + result.usage.output_tokens}
                  （${((result.usage.input_tokens / 1e6 * 3) + (result.usage.output_tokens / 1e6 * 15)).toFixed(4)}）
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">标题</p>
                <p className="font-semibold text-slate-800 text-sm">{result.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">正文</p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded p-3 leading-relaxed max-h-64 overflow-y-auto">
                  {result.content}
                </pre>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {result.suggested_images.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">📷 推荐配图（来自素材库）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {result.suggested_images.map(img => (
                    <div key={img.asset_id} className="space-y-1">
                      <img
                        src={img.image_url}
                        alt={img.description}
                        className="w-full h-28 object-cover rounded bg-slate-100"
                        onError={e => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/200x150?text=Image";
                        }}
                      />
                      <p className="text-xs text-slate-500 line-clamp-1">{img.description}</p>
                      <p className="text-xs text-slate-400">{(img.score * 100).toFixed(0)}% 匹配</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
