import fs from 'fs';
import path from 'path';

const CHARACTERS = ['manny', 'samson', 'esther', 'gedeon', 'noe', 'paul', 'pierre', 'moise', 'abraham', 'david'];
const POSES = ['idle', 'jumping', 'sad', 'running'];
const EXPRESSIONS = ['neutral', 'happy', 'sweating', 'crying'];
const OUTFITS = ['default', 'winter', 'beach', 'halloween'];

const outputBase = path.join('D:', 'Antigravity', 'mannadaily', 'public', 'assets', 'characters');

if (!fs.existsSync(outputBase)) {
  fs.mkdirSync(outputBase, { recursive: true });
}

const DESIGN_CONFIGS = {
  manny: {
    primary: '#4F46E5', secondary: '#3730A3', skin: '#FFFFFF', hair: '#64748B', accent: '#FBBF24',
  },
  samson: {
    primary: '#EA580C', secondary: '#B45309', skin: '#FDBA74', hair: '#78350F', accent: '#F59E0B',
  },
  esther: {
    primary: '#EC4899', secondary: '#BE185D', skin: '#FED7AA', hair: '#1E293B', accent: '#FBBF24',
  },
  gedeon: {
    primary: '#10B981', secondary: '#047857', skin: '#FDBA74', hair: '#451A03', accent: '#D97706',
  },
  noe: {
    primary: '#78350F', secondary: '#451A03', skin: '#FED7AA', hair: '#CBD5E1', accent: '#FFFFFF',
  },
  paul: {
    primary: '#8B5CF6', secondary: '#6D28D9', skin: '#FED7AA', hair: '#78350F', accent: '#FEF08A',
  },
  pierre: {
    primary: '#2563EB', secondary: '#1D4ED8', skin: '#FED7AA', hair: '#94A3B8', accent: '#FBBF24',
  },
  moise: {
    primary: '#DC2626', secondary: '#991B1B', skin: '#FDBA74', hair: '#E2E8F0', accent: '#9CA3AF',
  },
  abraham: {
    primary: '#F59E0B', secondary: '#D97706', skin: '#FED7AA', hair: '#E2E8F0', accent: '#78350F',
  },
  david: {
    primary: '#E2E8F0', secondary: '#64748B', skin: '#FDBA74', hair: '#EA580C', accent: '#F59E0B',
  },
};
