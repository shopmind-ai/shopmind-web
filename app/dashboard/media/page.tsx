"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Asset = {
  asset_id: string;
  image_url: string;
  category: string;
  tags: string[];
  description: string;
  score?: number;
};

const CATEGORIES = ["全部", "跑步装备", "健身器材", "户外露营"];

const CATEGORY_COLOR: Record<string, string> = {
  "跑步装备": "bg-blue-100 text-blue-700",
  "健身器材": "bg-green-100 text-green-700",
  "户外露营": "bg-amber-100 text-amber-700",
};

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploadUrl, setUploadUrl] = useState("");
  const [productHint, setProductHint] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastUsage, setLastUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("media_assets");
    if (saved) { try { setAssets(JSON.parse(saved)); return; } catch {} }
    loadAssets();
  }, []);
  useEffect(() => {
    if (assets.length > 0) sessionStorage.setItem("media_assets", JSON.stringify(assets));
  }, [assets]);

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await api.invokeAgent("media", { action: "list", limit: 20 }) as { assets: Asset[] };
      setAssets(res.assets || []);
    } catch { /* ignore on load error */ }
    finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!uploadUrl.trim()) return;
    setUploading(true);
    setError("");
    try {
      const res = await api.invokeAgent("media", {
        action: "upload",
        image_url: uploadUrl.trim(),
        product_hint: productHint.trim(),
      }) as { error?: string; usage?: { input_tokens: number; output_tokens: number } };
      if (res.error) { setError(res.error); return; }
      if (res.usage) setLastUsage(res.usage);
      setUploadUrl("");
      setProductHint("");
      await loadAssets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) { loadAssets(); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.invokeAgent("media", {
        action: "search",
        query: searchQuery.trim(),
        category: categoryFilter === "全部" ? "" : categoryFilter,
        limit: 12,
      }) as { results: Asset[]; usage: { input_tokens: number; output_tokens: number } };
      setAssets(res.results || []);
      setLastUsage(res.usage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🖼️ 多模态素材库</h1>
        <p className="text-slate-500 text-sm mt-1">上传商品图片 URL，AI 自动打标签 · 语义搜索素材</p>
      </div>

      {/* 上传区 */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-medium text-sm">上传商品图片</p>
          <div className="flex gap-2">
            <Input
              value={uploadUrl}
              onChange={e => setUploadUrl(e.target.value)}
              placeholder="粘贴图片 URL（支持 HTTPS）"
              className="flex-1"
            />
            <Input
              value={productHint}
              onChange={e => setProductHint(e.target.value)}
              placeholder="商品名称提示（可选）"
              className="w-44"
            />
            <Button onClick={handleUpload} disabled={uploading || !uploadUrl.trim()}>
              {uploading ? "分析中..." : "上传"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {lastUsage && (
            <p className="text-xs text-slate-400">
              Tokens: {lastUsage.input_tokens + lastUsage.output_tokens}
              （${((lastUsage.input_tokens / 1e6 * 3) + (lastUsage.output_tokens / 1e6 * 15)).toFixed(4)}）
            </p>
          )}
        </CardContent>
      </Card>

      {/* 搜索区 */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="语义搜索：红色跑鞋、防水装备..."
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border rounded px-3 text-sm bg-white"
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <Button onClick={handleSearch} disabled={loading} variant="outline">搜索</Button>
        <Button onClick={() => { setSearchQuery(""); loadAssets(); }} disabled={loading} variant="ghost">全部</Button>
      </div>

      {/* 素材网格 */}
      {loading ? (
        <p className="text-slate-400 text-sm">加载中...</p>
      ) : assets.length === 0 ? (
        <p className="text-slate-400 text-sm">暂无素材，上传第一张商品图片吧</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {assets.map(asset => (
            <Card key={asset.asset_id} className="overflow-hidden">
              <img
                src={asset.image_url}
                alt={asset.description}
                className="w-full h-40 object-cover bg-slate-100"
                onError={e => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Image";
                }}
              />
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[asset.category] ?? "bg-slate-100 text-slate-600"}`}>
                    {asset.category || "未分类"}
                  </span>
                  {asset.score !== undefined && (
                    <span className="text-xs text-slate-400">{(asset.score * 100).toFixed(0)}% 匹配</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{asset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(asset.tags || []).slice(0, 4).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
