/**
 * 統計情報表示パネル
 */
import type { MeshStatistics } from '../types';

interface StatsPanelProps {
  stats: MeshStatistics | null;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <div className="w-full md:w-96 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">MeshScope</h2>
        <p className="text-gray-600">
          地図をクリックして、500mメッシュの統計情報を表示します。
        </p>
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-gray-700 mb-2">使い方</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>地図上の任意の場所をクリック</li>
              <li>500mメッシュの人口・事業所数を表示</li>
              <li>生活完結指数を可視化</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-semibold text-gray-700 mb-2">生活完結指数</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <span className="font-medium">利便性:</span> 事業所密度
              </div>
              <div>
                <span className="font-medium">居住性:</span> 人口密度の適度さ
              </div>
              <div>
                <span className="font-medium">多様性:</span> 人口と事業所のバランス
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { mesh_code, population, businesses, livability_index } = stats;

  return (
    <div className="w-full md:w-96 bg-white shadow-lg p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">メッシュ情報</h2>

      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs text-gray-500 mb-1">メッシュコード</div>
          <div className="font-mono text-sm font-semibold">{mesh_code}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded">
            <div className="text-xs text-gray-500 mb-1">人口</div>
            <div className="text-2xl font-bold text-blue-600">{population}</div>
            <div className="text-xs text-gray-500">人</div>
          </div>

          <div className="p-3 bg-green-50 rounded">
            <div className="text-xs text-gray-500 mb-1">事業所数</div>
            <div className="text-2xl font-bold text-green-600">{businesses}</div>
            <div className="text-xs text-gray-500">所</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-3">生活完結指数</h3>

          <div className="space-y-3">
            <ScoreBar
              label="利便性"
              score={livability_index.convenience}
              color="bg-purple-500"
            />
            <ScoreBar
              label="居住性"
              score={livability_index.livability}
              color="bg-blue-500"
            />
            <ScoreBar
              label="多様性"
              score={livability_index.diversity}
              color="bg-green-500"
            />
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded">
            <div className="text-xs text-gray-500 mb-1">総合スコア</div>
            <div className="text-3xl font-bold text-orange-600">
              {livability_index.overall.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">/ 100</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
