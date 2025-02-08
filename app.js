/**
 * @file 应用程序主模块，负责核心初始化和全局状态管理
 * @module app
 * @requires @supabase/supabase-js
 */

// ======================
// 初始化区块
// ======================
const { createClient } = supabase;
/**
 * Supabase客户端实例
 * @type {SupabaseClient}
 * @global
 */
const supabaseClient = createClient(
  'https://jzpcrdvffrpdyuetbefb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM'
);

// ======================
// 事件监听初始化
// ======================
document.addEventListener('DOMContentLoaded', function() {
    // 确保只在浏览页面初始化
    if (window.location.pathname.includes('browse.html')) {
        initPage();
        initSelectAllCheckboxes();
        bindGlobalEvents();
        loadPosts(); // 显式调用加载
    }
});

// ======================
// 核心功能区块
// ======================

// 将筛选相关函数集中
const FilterUtils = {
    getCheckedValues,
    checkMatch,
    checkReport,
    setTimeFilter,
    applyCustomTimeFilter,
    clearTimeFilter
};

// 将表单处理集中
const FormHandlers = {
    handleVersionChange,
    handleConnectionTypeChange,
    handleRetentionTimeChange,
    validatePost,
    resetForm
};

// ======================
// 工具函数
// ======================
const Utils = {
    formatTime,
    getStoredPosts,
    renderPost,
    validatePostData
};

// ======================
// 事件处理统一管理
// ======================
function bindGlobalEvents() {
    // 表单提交改为直接绑定现有处理函数
    document.getElementById('postForm')?.addEventListener('submit', handleSubmit);
    
    // 全局点击事件
    document.body.addEventListener('click', handleGlobalClick);
    
    // 搜索功能
    document.getElementById('searchButton')?.addEventListener('click', filterPosts);
}

// ======================
// 核心功能函数
// ======================

/**
 * 加载并渲染帖子列表（带服务端过滤）
 * 1. 构建动态查询条件
 * 2. 处理版本筛选
 * 3. 添加客户端序号
 * 4. 异常处理与用户反馈
 */
async function loadPosts() {
    try {
        const posts = await fetchPostsFromSupabase();
        const container = document.getElementById('postsList');
        
        if (!container) {
            console.error('帖子容器未找到');
            return;
        }
        
        container.innerHTML = posts.length > 0 
            ? posts.map(post => renderPost(post)).join('')
            : '<div class="empty-tip">暂时没有帖子，快来发布第一条吧！</div>';
            
    } catch (error) {
        console.error('加载失败:', error);
        alert('帖子加载失败，请刷新重试');
    }
}

// 暴露到全局
window.loadPosts = loadPosts;

// ======================
// 表单处理（补充验证逻辑说明）
// ======================

/**
 * 获取本地存储的帖子数据
 * 数据增强：
 * - 自动生成序列号
 * - 确保内容前缀格式
 * - 数据回迁处理
 */
function getStoredPosts() {
    const stored = localStorage.getItem('mcPosts');
    const data = stored ? JSON.parse(stored) : { posts: [] };
    
    data.posts = data.posts.map(post => {
        // 确保只添加一次编号
        if (!post.serialNumber) {
            post.serialNumber = data.posts.indexOf(post) + 1;
            if (!post.content.startsWith(`#${post.serialNumber}`)) {
                post.content = `#${post.serialNumber}\n${post.content}`;
            }
        }
        return post;
    });
    
    return data;
}

// 保存新帖子到本地存储
async function savePost(post) {
    const storage = getStoredPosts();
    post.serialNumber = storage.posts.length + 1;
    // 仅在内容开头添加一次编号
    if (!post.content.startsWith(`#${post.serialNumber}`)) {
        post.content = `#${post.serialNumber}\n${post.content}`;
    }
    storage.posts.unshift(post);
    localStorage.setItem('mcPosts', JSON.stringify(storage));
    return true;
}

// ======================
// 表单处理相关
// ======================

// ======================
// 新增初始化函数
// ======================
import { initFilters, initSelectAllCheckboxes } from './js/filter.js';
import { initForm } from './js/form.js';

/**
 * 页面初始化入口
 * @function initPage
 * @description 协调各子模块初始化，包括表单、筛选、交互等
 */
function initPage() {
    initForm();
    loadPosts();
    initFilters(); // 现在包含全选初始化
    bindGlobalEvents();
}

// ======================
// 数据存储相关修改
// ======================

// 移除原有的getStoredPosts函数
// 新增Supabase数据获取函数
async function fetchPostsFromSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('获取帖子失败:', error);
        return [];
    }
}

// 修改保存函数
async function savePostToSupabase(post) {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .insert([post])
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('保存失败:', error);
        return null;
    }
}

// 在app.js中添加表单绑定
function bindFormSubmit() {
    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
}

// 保留用户认证相关逻辑
async function handleAuth() {
    // ...
}

// 在文件底部添加导出
export { 
    fetchPostsFromSupabase, 
    handleViewDetail, 
    handleReport,
    formatTime,
    supabaseClient,
    loadPosts  // 确保list.js需要的函数已导出
};