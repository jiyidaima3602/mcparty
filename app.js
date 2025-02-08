/**
 * @file 应用程序入口模块
 * @module app
 */

// 仅保留全局通用功能
export { handleViewDetail, handleReport } from './interaction.js';

import { loadPosts } from './js/list.js';
import { bindSearchEvents } from './js/filter.js';

export function initApp() {
    loadPosts();
    bindSearchEvents();
}