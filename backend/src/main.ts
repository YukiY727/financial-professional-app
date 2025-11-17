/**
 * バックエンドAPIサーバー（Express）
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { runSimulation } from '../../shared/domain/simulationEngine.js';
import type { SimulationInput, SimulationResult } from '../../shared/domain/types.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());

/**
 * ヘルスチェック
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * シミュレーション実行API
 */
app.post('/api/simulate', (req: Request, res: Response) => {
  try {
    const input: SimulationInput = req.body;

    // 入力バリデーション（簡易版）
    if (!input.profile || !input.simpleExpense) {
      res.status(400).json({ error: 'Invalid input: missing profile or simpleExpense' });
      return;
    }

    const { profile } = input;

    // バリデーション
    if (profile.currentAge < 20 || profile.currentAge > 70) {
      res.status(400).json({ error: '現在の年齢は20〜70歳の範囲で指定してください' });
      return;
    }

    if (profile.retirementAge <= profile.currentAge || profile.retirementAge > 80) {
      res.status(400).json({ error: '退職年齢は現在の年齢より大きく、80歳以下で指定してください' });
      return;
    }

    if (profile.currentAnnualIncome <= 0 || profile.currentAnnualIncome > 100_000_000) {
      res.status(400).json({ error: '年収は1円〜1億円の範囲で指定してください' });
      return;
    }

    if (input.simpleExpense.savingsRate < 0 || input.simpleExpense.savingsRate > 100) {
      res.status(400).json({ error: '貯金率は0〜100%の範囲で指定してください' });
      return;
    }

    // シミュレーション実行
    const result: SimulationResult = runSimulation(input);

    res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/simulate`);
});
