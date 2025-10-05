export * from './types';
export * from './client';
export * from './plugins';
export * from './cacheIndex';

// factories + back-compat aliases
export { createLoggerPlugin, LoggerPlugin } from './plugins/LoggerPlugin';
export { createAnalyticsPlugin, AnalyticsPlugin } from './plugins/AnalyticsPlugin';
export { createPrismaSyncPlugin, type PrismaSyncConfig } from './plugins/PrismaSyncPlugin';
