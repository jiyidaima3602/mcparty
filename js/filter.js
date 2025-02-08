import { renderPost, fetchPostsFromSupabase } from './app.js';

/**
 * @file 筛选功能模块，处理多维度帖子筛选
 * @module filter
 */

/**
 * 当前筛选条件集合
 * @typedef {Object} FilterConditions
 * @property {string[]} versions - 选中的版本
 * @property {string[]} playstyles - 选中的玩法风格
 * @property {string[]} loaders - 选中的加载器
 * @property {string[]} connections - 选中的联机方式
 * @property {string[]} servers - 选中的服务器类型
 * @property {string[]} saves - 选中的存档类型
 * @property {Object|null} time - 时间筛选条件
 * @property {string} search - 搜索关键词
 */

// 完整的多维度筛选条件
let currentFilters = {
    versions: [],
    playstyles: [],
    loaders: [],
    connections: [],
    servers: [],
    saves: [],
    time: null,
    search: ''
};

// 筛选相关状态
let currentTimeFilter = null;
let activeTimeButton = null;

// 通用筛选函数
export function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value);
}

export function checkMatch(selected, value) {
    if (selected.length === 0) return true;
    const values = Array.isArray(value) ? value : [value];
    return values.some(v => selected.includes(v));
}

export function checkReport(selected, isReported) {
    if (selected.length === 0) return true;
    if (selected.includes('已举报') && isReported) return true;
    if (selected.includes('未举报') && !isReported) return true;
    return false;
}

// 时间筛选处理
export function setTimeFilter(minutes) {
    const button = event.target;
    button.classList.toggle('active');
    currentTimeFilter = button.classList.contains('active') ? minutes : null;
    filterPosts();
}

export function applyCustomTimeFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        currentTimeFilter = {
            start: new Date(startDate),
            end: new Date(endDate)
        };
        filterPosts();
    } else {
        alert('请选择完整的日期范围');
    }
}

export function clearTimeFilter() {
    document.querySelectorAll('.quick-time-buttons button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    currentTimeFilter = null;
    activeTimeButton = null;
}

/**
 * 初始化全选复选框逻辑
 * @function initSelectAllCheckboxes
 * @example
 * // 初始化所有包含[data-group]属性的全选复选框
 * initSelectAllCheckboxes();
 */
export function initSelectAllCheckboxes() {
    document.querySelectorAll('.select-all').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const group = this.dataset.group;
            const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
                cb.dispatchEvent(new Event('change')); // 触发筛选更新
            });
        });
    });
}

// 初始化筛选事件
export function initFilters() {
    initSelectAllCheckboxes();
    // 绑定所有筛选条件变化
    document.querySelectorAll('.filter-section input').forEach(input => {
        input.addEventListener('change', updateFilters);
    });
    
    // 时间筛选按钮
    document.querySelectorAll('.quick-time-buttons button').forEach(btn => {
        btn.addEventListener('click', handleQuickTimeFilter);
    });
    
    // 自定义时间筛选
    document.getElementById('applyCustomTime')?.addEventListener('click', applyCustomTimeFilter);
    document.getElementById('clearTimeFilter')?.addEventListener('click', clearTimeFilter);
    
    // 搜索功能
    document.getElementById('searchButton')?.addEventListener('click', () => {
        currentFilters.search = document.getElementById('searchInput').value;
        filterPosts();
    });
}

// 更新筛选条件
function updateFilters() {
    currentFilters = {
        versions: getCheckedValues('filter-version'),
        playstyles: getCheckedValues('filter-playstyle'),
        loaders: getCheckedValues('filter-loader'),
        connections: getCheckedValues('filter-connection'),
        servers: getCheckedValues('filter-server'),
        saves: getCheckedValues('filter-save'),
        time: currentFilters.time,
        search: currentFilters.search
    };
    filterPosts();
}

// ======================
// 主筛选逻辑
// 功能：多维度联合筛选
// 依赖：所有check*函数
// ======================
export async function filterPosts() {
    try {
        const posts = await fetchPostsFromSupabase();
        const filtered = posts.filter(post => {
            return (
                checkVersion(post.version) &&
                checkPlaystyle(post.playstyles) &&
                checkLoader(post.loader) &&
                checkConnection(post.connection_type) &&
                checkServer(post.server_type) &&
                checkSave(post.save_type) &&
                checkTime(post.created_at) &&
                checkSearch(post)
            );
        });
        renderFilterResults(filtered);
    } catch (error) {
        console.error('筛选失败:', error);
    }
}

// 各维度检查函数
function checkVersion(postVersion) {
    if (currentFilters.versions.length === 0) return true;
    return currentFilters.versions.includes(postVersion);
}

function checkPlaystyle(postPlaystyles) {
    if (currentFilters.playstyles.length === 0) return true;
    const postStyles = postPlaystyles?.split(', ') || [];
    return postStyles.some(style => currentFilters.playstyles.includes(style));
}

function checkLoader(postLoader) {
    if (currentFilters.loaders.length === 0) return true;
    return currentFilters.loaders.includes(postLoader);
}

function checkConnection(postConnection) {
    if (currentFilters.connections.length === 0) return true;
    return currentFilters.connections.includes(postConnection);
}

function checkServer(postServer) {
    if (currentFilters.servers.length === 0) return true;
    return currentFilters.servers.includes(postServer);
}

function checkSave(postSave) {
    if (currentFilters.saves.length === 0) return true;
    return currentFilters.saves.includes(postSave);
}

function checkTime(createdAt) {
    if (!currentTimeFilter) return true;
    const postTime = new Date(createdAt).getTime();
    
    if (typeof currentTimeFilter === 'number') {
        const cutoff = Date.now() - currentTimeFilter * 60000;
        return postTime >= cutoff;
    }
    return postTime >= currentTimeFilter.start && postTime <= currentTimeFilter.end;
}

function checkSearch(post) {
    const searchText = currentFilters.search.toLowerCase();
    if (!searchText) return true;
    return [post.title, post.content, post.contact].some(
        text => text.toLowerCase().includes(searchText)
    );
}

function renderFilterResults(posts) {
    const container = document.getElementById('postsList');
    container.innerHTML = posts.length > 0 
        ? posts.map(post => renderPost(post)).join('')
        : '<div class="empty-tip">没有找到匹配的帖子</div>';
}

// 初始化筛选事件
document.getElementById('searchButton')?.addEventListener('click', filterPosts);
document.querySelectorAll('.filter-section input').forEach(input => {
    input.addEventListener('change', filterPosts);
}); 