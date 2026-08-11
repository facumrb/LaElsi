import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Service Worker Configuration Verification (ngsw-config.json)', () => {
  const ngswPath = path.join(__dirname, '../fe/ngsw-config.json');

  it('should exist and be valid JSON', () => {
    expect(fs.existsSync(ngswPath)).toBe(true);
    const content = fs.readFileSync(ngswPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should contain expected asset groups for app shell and static resources', () => {
    const config = JSON.parse(fs.readFileSync(ngswPath, 'utf-8'));
    expect(config.assetGroups).toBeDefined();

    const appGroup = config.assetGroups.find((g: any) => g.name === 'app');
    expect(appGroup).toBeDefined();
    expect(appGroup.installMode).toBe('prefetch');

    const assetsGroup = config.assetGroups.find((g: any) => g.name === 'assets');
    expect(assetsGroup).toBeDefined();
    expect(assetsGroup.installMode).toBe('lazy');
  });

  it('should configure dataGroup for product uploaded photos with performance caching strategy', () => {
    const config = JSON.parse(fs.readFileSync(ngswPath, 'utf-8'));
    expect(config.dataGroups).toBeDefined();

    const uploadsGroup = config.dataGroups.find((g: any) => g.name === 'product-uploads');
    expect(uploadsGroup).toBeDefined();
    expect(uploadsGroup.urls).toContain('/uploads/**');
    expect(uploadsGroup.cacheConfig.strategy).toBe('performance');
    expect(uploadsGroup.cacheConfig.maxAge).toBe('30d');
    expect(uploadsGroup.cacheConfig.maxSize).toBe(200);
  });
});
