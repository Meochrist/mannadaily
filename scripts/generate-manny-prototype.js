import fs from 'fs';
import path from 'path';

const outputDir = path.join('D:', 'Antigravity', 'mannadaily', 'public', 'assets', 'characters', 'manny');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const colors = {
  cover: '#4F46E5', coverDark: '#3730A3', pages: '#FFFFFF', pagesShadow: '#E2E8F0', pagesLine: '#CBD5E1',
  limbs: '#64748B', feet: '#FBBF24', shadow: '#E2E8F0', shadowJump: '#CBD5E1', faceText: '#1E293B',
  blush: '#FDA4AF', tongue: '#F472B6', mouthBg: '#EF4444',
};
