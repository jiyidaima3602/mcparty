/**
 * @file 应用程序入口模块
 * @module app
 */

// 仅作为模块导出中转站
export { handleViewDetail, handleReport } from './js/interaction.js';

import { loadPosts } from './js/list.js';
import { bindSearchEvents } from './js/filter.js';

export function initApp() {
    loadPosts();
    bindSearchEvents();
}