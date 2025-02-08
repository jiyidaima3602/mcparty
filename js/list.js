import { fetchPostsFromSupabase } from './form.js';
import { handleViewDetail, handleReport, handleGlobalClick } from './interaction.js';
import { formatTime } from './utils.js';
import { initSelectAllCheckboxes } from './filter.js';
import { initInteractions } from './interaction.js';
import { filterPosts } from './filter.js';

/**
 * @file 帖子列表渲染模块，负责列表展示和基础交互
 * @module list
 */

// 页面加载初始化
document.addEventListener('DOMContentLoaded', () => {
    if (isBrowsePage()) {
        loadPosts();
        initSelectAllCheckboxes();
        bindGlobalEvents();
    }
});

function isBrowsePage() {
    return window.location.pathname.includes('browse.html');
}

// 帖子列表渲染功能
export async function loadPosts() {
    try {
        await filterPosts(); // 改为调用筛选函数
    } catch (error) {
        console.error('加载失败:', error);
        alert('帖子加载失败，请检查网络连接或联系管理员');
        const container = document.getElementById('postsList');
        if (container) {
            container.innerHTML = `
                <div class="error-tip">
                    <p>加载失败：${error.message}</p>
                    <p>请稍后重试或联系管理员</p>
                </div>`;
        }
    }
}

/**
 * 渲染单个帖子项
 * @function renderPost
 * @param {Object} post - 帖子数据对象
 * @param {string} post.title - 帖子标题
 * @param {string} post.content - 帖子内容
 * @param {number} post.id - 帖子唯一ID
 * @param {string} post.created_at - 创建时间ISO字符串
 * @param {string} post.connection_type - 联机类型
 * @returns {string} HTML字符串
 * @example
 * const html = renderPost({
 *   title: '测试帖子',
 *   content: '这是一个测试内容'
 * });
 */
export function renderPost(post) {
    return `
    <div class="post-item">
      <h3>${post.title}</h3>
      <div class="post-meta">
        <span>${formatTime(post.created_at)}</span>
      </div>
      <div class="meta-grid">
        <div><strong>联机类型：</strong>${post.server_type || '未填写'}</div>
        <div><strong>联机方式：</strong>${post.connection_type || '未填写'}</div>
        <div><strong>游戏类型：</strong>${post.game_type || '未填写'}</div>
        <div><strong>联系方式：</strong>${post.contact || '未提供'}</div>
        <div><strong>留存时间：</strong>${post.retention_time / 1440}天</div>
        <div><strong>游戏版本：</strong>${post.version || '未填写'}</div>
        <div><strong>存档类型：</strong>${post.save_type || '未填写'}</div>
        <div><strong>加载器：</strong>${post.loader || '未填写'}</div>
      </div>
      <div class="post-content">
        ${post.content}
      </div>
      ${post.playstyles ? `
      <div class="playstyle-tags">
        ${post.playstyles.split(', ').map(style => `<span class="tag">${style}</span>`).join('')}
      </div>` : ''}
      <div class="post-actions">
        <button class="view-detail-btn" data-post-id="${post.id}">查看详情</button>
        ${!post.reported ? 
          `<button class="report-btn" data-id="${post.id}">举报</button>` : 
          `<button class="report-btn reported" disabled>已举报</button>`
        }
      </div>
    </div>`;
}

// 初始化帖子交互事件
function initPostInteractions() {
    initInteractions();
}

// 修改全局事件绑定函数
export function bindGlobalEvents() {
    document.body.addEventListener('click', handleGlobalClick);
}

// 修改默认导出部分
export default {
    loadPosts,
    renderPost,
    bindGlobalEvents
}; 