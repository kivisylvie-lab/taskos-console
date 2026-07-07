/**
 * Demo Mode 管理器
 *
 * 当 Demo Mode 激活时，api.ts 中 AI 调用方法会直接返回预置数据，
 * 而不需要真实的 API Key。
 */

import { SUPPLY_CHAIN_DEMO_DATA } from './supplyChainDemoData';
import { BUSINESS_SOLUTION_DEMO_DATA } from './businessSolutionDemoData';

let demoModeActive = false;
let demoStepData: Record<string, any> = {};

export function enableDemoMode(demoName: string = 'supply-chain'): Record<string, any> {
  demoModeActive = true;
  if (demoName === 'business-solution') {
    demoStepData = { ...BUSINESS_SOLUTION_DEMO_DATA };
  } else if (demoName === 'supply-chain') {
    demoStepData = { ...SUPPLY_CHAIN_DEMO_DATA };
  }
  return demoStepData;
}

export function disableDemoMode(): void {
  demoModeActive = false;
  demoStepData = {};
}

export function isDemoMode(): boolean {
  return demoModeActive;
}

export function getDemoStepResult(step: string): any {
  if (!demoModeActive) return null;
  return demoStepData[step] || null;
}

export function getAllDemoStepResults(): Record<string, any> {
  return demoStepData;
}
