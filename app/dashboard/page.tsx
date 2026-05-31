export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">概览</h1>
      <p className="text-slate-500 mt-2">欢迎使用 ShopMind AI 电商智能运营平台</p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-slate-500 text-sm">已接入 Agent</p>
          <p className="text-3xl font-bold mt-1">3 / 8</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-slate-500 text-sm">平台状态</p>
          <p className="text-3xl font-bold mt-1 text-green-600">运行中</p>
        </div>
      </div>
    </div>
  );
}
