"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Clip = {
  clip_id: string;
  start_time: number;
  end_time: number;
  title: string;
  description: string;
  transcript_excerpt: string;
  file_path: string;
};

type ClipResult = {
  job_id: string;
  clips: Clip[];
  total_duration: number;
  clip_count: number;
  usage: { input_tokens: number; output_tokens: number };
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ClipPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [maxClips, setMaxClips] = useState(3);
  const [clipDuration, setClipDuration] = useState(30);
  const [result, setResult] = useState<ClipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleProcess() {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.invokeAgent("clip", {
        video_url: videoUrl.trim(),
        max_clips: maxClips,
        clip_duration: clipDuration,
      }) as ClipResult;
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">✂️ 直播切片</h1>
        <p className="text-slate-500 text-sm mt-1">
          输入直播视频 URL，AI 自动识别精彩片段并用 FFmpeg 切片
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">视频 URL</label>
            <Input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://example.com/livestream.mp4"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">最大片段数</label>
              <Input
                type="number"
                value={maxClips}
                onChange={e => setMaxClips(Number(e.target.value))}
                min={1} max={10}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">片段时长（秒）</label>
              <Input
                type="number"
                value={clipDuration}
                onChange={e => setClipDuration(Number(e.target.value))}
                min={10} max={120}
              />
            </div>
          </div>
          <Button
            onClick={handleProcess}
            disabled={loading || !videoUrl.trim()}
            className="w-full"
          >
            {loading ? "处理中（下载+转录+切片，约需1-3分钟）..." : "开始处理"}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Job ID: <code className="font-mono text-xs bg-slate-100 px-1">{result.job_id.slice(0, 8)}...</code></span>
            <span>视频时长: {formatTime(result.total_duration)}</span>
            <span>识别片段: {result.clip_count} 个</span>
            <span>Tokens: {result.usage.input_tokens + result.usage.output_tokens}</span>
          </div>

          <div className="space-y-3">
            {result.clips.map((clip, i) => (
              <Card key={clip.clip_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatTime(clip.start_time)} → {formatTime(clip.end_time)}
                        </Badge>
                        <span className="font-semibold text-sm">{clip.title}</span>
                      </div>
                      <p className="text-sm text-slate-600">{clip.description}</p>
                      {clip.transcript_excerpt && (
                        <p className="text-xs text-slate-400 italic">
                          &ldquo;{clip.transcript_excerpt}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-slate-300 font-mono">{clip.file_path}</p>
                    </div>
                    <div className="text-2xl text-slate-300">✂️</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
