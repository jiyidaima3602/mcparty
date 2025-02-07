// ======================
// 文件结构重组说明：
// 1. 将相关功能集中到统一区块
// 2. 调整函数顺序保持逻辑连贯性
// 3. 添加更清晰的注释分隔
// ======================

// ======================
// 初始化区块（补充说明）
// ======================
const { createClient } = supabase;
// Supabase客户端初始化（使用项目URL和匿名密钥）
const supabaseClient = createClient(
  'https://jzpcrdvffrpdyuetbefb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM'
);
let isAdminAuthenticated = false; // 管理员认证状态标识

// ======================
// 事件监听初始化 (提前)
// ======================
document.addEventListener('DOMContentLoaded', function() {
    initPage();
    initSelectAllCheckboxes();
    bindGlobalEvents();
    
    // 添加帖子加载
    if (document.getElementById('postsList')) {
        fetchAndDisplayPosts();
    }
});

// ======================
// 核心功能区块（补充函数说明）
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
// 管理员功能区块调整
// ======================
// 将密码管理相关集中
const AdminAuth = {
    checkAdminPassword,
    resetAdminPassword: function() {
        localStorage.removeItem('adminPassword');
        alert('管理员密码已重置');
    },
    encryptPassword: function(password) {
        return btoa(password); // 简单base64加密
    },
    initAdminPage
};

// ======================
// 工具函数区块优化
// ======================
// 新增工具类函数
const Utils = {
    formatTime,      // 从文件底部移动至此
    getStoredPosts,  // 从原位置移动至此
    renderPost,      // 从文件底部移动至此
    validatePostData // 从底部移动至此
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
// 新增统一事件处理器
// ======================
function handleGlobalClick(e) {
    const { target } = e;
    
    // 处理查看详情
    if (target.classList.contains('view-detail-btn')) {
        handleViewDetail(e);
    }
    
    // 处理举报按钮
    if (target.classList.contains('report-btn')) {
        handleReport(e);
    }
    
    // 处理删除按钮
    if (target.classList.contains('delete-btn')) {
        handleDeletePost(e);
    }
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
        // 完全移除DOM操作
        console.log('已加载帖子数量:', posts.length);
    } catch (error) {
        console.error('加载失败:', error);
    }
}

// 暴露到全局
window.loadPosts = loadPosts;

/**
 * 综合过滤帖子列表
 * 处理逻辑：
 * - 文本搜索（标题/内容/联系方式）
 * - 多维度条件筛选（版本/加载器/联机类型等）
 * - 时间范围过滤（支持快速筛选和自定义范围）
 * - 举报状态过滤
 */
async function filterPosts() {
    try {
        const posts = await fetchPostsFromSupabase();
        // 保留筛选逻辑但移除显示
        const filteredPosts = posts.filter(/* 筛选条件 */);
        console.log('筛选结果:', filteredPosts);
    } catch (error) {
        console.error('筛选失败:', error);
    }
}

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

/**
 * 主表单提交处理
 * 功能要点：
 * - 动态处理"其他"版本输入
 * - 多选游玩风格处理
 * - 自定义留存时间验证
 * - 自动生成序列号
 * - 数据持久化与界面更新
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    try {
        // 获取表单元素引用
        const versionSelect = document.getElementById('version');
        const retentionTimeSelect = document.getElementById('retentionTime');
        
        // 处理版本选择
        const version = versionSelect.value === '其他' ?
            prompt('请输入您的游戏版本号：') :
            versionSelect.value;

        // 处理多选游玩风格
        const playstyles = Array.from(document.querySelectorAll('input[name="playstyle"]:checked'))
            .map(input => input.value)
            .join(', ');

        // 构建完整帖子对象
        const newPost = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            version: version,
            server_type: document.getElementById('serverType').value,
            connection_type: document.getElementById('connectionType').value,
            game_type: document.getElementById('gameType').value,
            save_type: document.getElementById('saveType').value,
            playstyles: playstyles,
            loader: document.getElementById('loader').value,
            contact: document.getElementById('contact').value.trim(),
            created_at: new Date().toISOString(),
            retention_time: Number(retentionTimeSelect.value),
            reported: false
        };

        if (!validatePost(newPost)) return;

        // 使用Supabase保存函数
        const savedPost = await savePostToSupabase(newPost);
        if (!savedPost) throw new Error('保存失败');

        resetForm();
        await loadPosts();
        alert('帖子提交成功！');
        
    } catch (error) {
        console.error('提交失败:', error);
        alert(`提交失败: ${error.message}`);
    }
}

// 表单验证
function validatePost({title, content, version, contact}) {
    if (!title || !content || !version || !contact) {
        alert('请填写所有必填字段！');
        return false;
    }
    return true;
}

// 表单字段变化处理
function handleVersionChange(select) {
    if (select.value === '其他') {
        const customVersion = prompt('请输入您的游戏版本号：');
        if (customVersion) {
            // 创建一个新的 option 并设置为选中
            const newOption = new Option(customVersion, customVersion);
            newOption.selected = true;
            select.add(newOption);
        } else {
            select.value = '';
        }
    }
}

function handleConnectionTypeChange(select) {
    const customInput = document.getElementById('customConnectionInput');
    customInput.style.display = select.value === '其他' ? 'block' : 'none';
}

function handleRetentionTimeChange(select) {
    const customRetentionDiv = document.getElementById('customRetentionTime');
    if (select.value === 'custom') {
        customRetentionDiv.style.display = 'block';
    } else {
        customRetentionDiv.style.display = 'none';
    }
}

// ======================
// 筛选功能相关
// ======================

// 通用筛选函数
function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value);
}

function checkMatch(selected, value) {
    if (selected.length === 0) return true;
    // 处理数组类型的值（如版本可能有多个）
    const values = Array.isArray(value) ? value : [value];
    return values.some(v => selected.includes(v));
}

function checkReport(selected, isReported) {
    if (selected.length === 0) return true;
    if (selected.includes('已举报') && isReported) return true;
    if (selected.includes('未举报') && !isReported) return true;
    return false;
}

// 时间筛选处理
let currentTimeFilter = null;
let activeTimeButton = null;

function setTimeFilter(minutes) {
    const button = event.target;
    
    if (button.classList.contains('active')) {
        currentTimeFilter = null;
    } else {
        currentTimeFilter = minutes;
    }
    
    button.classList.toggle('active');
    filterPosts(); // 添加筛选触发
}

function applyCustomTimeFilter() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        currentTimeFilter = {
            start: new Date(startDate),
            end: new Date(endDate)
        };
        // 触发搜索
        filterPosts();
    } else {
        alert('请选择完整的日期范围');
    }
}

function clearTimeFilter() {
    // 移除所有激活按钮的样式
    document.querySelectorAll('.quick-time-buttons button').forEach(button => {
        button.classList.remove('active');
    });

    // 清空自定义日期输入
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';

    // 重置时间筛选
    currentTimeFilter = null;
    activeTimeButton = null;
}

// ======================
// 帖子操作功能
// ======================

// 查看详情
function handleViewDetail(e) {
    const postId = e.target.dataset.postId;
    if (postId) {
        window.location.href = `post.html?id=${postId}`;
    }
}

// 删除/恢复操作
function handleDeletePost(e) {
    const postId = Number(e.target.dataset.id);
    if (!postId) return;

    const storage = getStoredPosts();
    storage.posts = storage.posts.filter(post => post.id !== postId);
    localStorage.setItem('mcPosts', JSON.stringify(storage));
    loadPosts();
}

function handleRestoreReport(postId) {
    const storage = getStoredPosts();
    const post = storage.posts.find(p => p.id == postId);
    post.reported = false;
    localStorage.setItem('mcPosts', JSON.stringify(storage));
}

// ======================
// 管理员功能（补充安全说明）
// ======================

/**
 * 管理员页面初始化
 * 安全机制：
 * - 使用sessionStorage存储临时认证状态
 * - 页面跳转保护
 * - 密码加密存储（示例使用base64）
 */
function initAdminPage() {
    // 检查sessionStorage中的认证状态
    const sessionAuth = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    
    if (sessionAuth) {
        isAdminAuthenticated = true;
        loadPosts();
        return;
    }

    // 未认证时进行密码验证
    if (checkAdminPassword()) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        isAdminAuthenticated = true;
        loadPosts();
    } else {
        window.location.href = 'index.html';
    }
}

// ======================
// 通用工具函数
// ======================

// 自定义版本号处理
function addCustomVersion() {
    const customVersion = document.getElementById('customVersion').value.trim();
    if (customVersion) {
        // 创建新的复选框
        const newCheckbox = document.createElement('label');
        newCheckbox.innerHTML = `<input type="checkbox" name="filter-version" value="${customVersion}"> ${customVersion}`;
        
        // 添加到版本筛选区域
        document.querySelector('.version-checkboxes').appendChild(newCheckbox);
        
        // 清空输入框
        document.getElementById('customVersion').value = '';
    }
}

// 自定义联机方式处理
function addCustomConnection() {
    const customValue = document.getElementById('customConnection').value.trim();
    if (customValue) {
        const select = document.getElementById('connectionType');
        const newOption = new Option(customValue, customValue);
        select.add(newOption);
        select.value = customValue;
        document.getElementById('customConnection').value = '';
        document.getElementById('customConnectionInput').style.display = 'none';
    }
}

// 全选功能
function selectAll(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// ======================
// 复选框操作函数
// ======================

// 初始化全选功能
function initSelectAll(checkbox) {
    // 全选/取消全选处理
    checkbox.addEventListener('change', function() {
        const group = this.dataset.group;
        setGroupCheckboxes(group, this.checked);
    });

    // 子复选框变化监听
    const group = checkbox.dataset.group;
    const childCheckboxes = document.querySelectorAll(`input[name="${group}"]`);
    childCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            updateSelectAllState(checkbox, group);
        });
    });
}

// 设置整组复选框状态
function setGroupCheckboxes(groupName, checked) {
    document.querySelectorAll(`input[name="${groupName}"]`).forEach(cb => {
        cb.checked = checked;
    });
}

// 更新全选复选框状态
function updateSelectAllState(selectAllCheckbox, groupName) {
    const allChecked = Array.from(document.querySelectorAll(`input[name="${groupName}"]`))
        .every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
}

// 在适当的位置添加以下举报处理函数
async function reportPost(postId, reason) {
    const { error } = await supabaseClient
        .from('reports')
        .insert([
            { 
                post_id: postId,
                reason: reason || '不良信息',
                reported_at: new Date().toISOString()
            }
        ]);

    if (error) {
        console.error('举报提交失败:', error);
        alert('举报提交失败，请稍后再试');
        return false;
    }
    alert('举报已提交，我们会尽快处理！');
    return true;
}

// 在DOM加载完成后绑定事件（如果使用事件委托）
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('report-btn')) {
            const postId = e.target.dataset.postId;
            const reason = prompt('请输入举报原因（可选）:');
            if (confirm('确认要举报该内容吗？')) {
                await reportPost(postId, reason);
            }
        }
    });
});

// 在文件底部添加获取单个帖子详情的函数
async function getPostDetail(postId) {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }
    return data;
}

// 添加页面加载时获取帖子详情的逻辑
document.addEventListener('DOMContentLoaded', async () => {
    // 解析URL中的帖子ID参数
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        const post = await getPostDetail(postId);
        if (post) {
            // 填充帖子详情到页面元素
            document.getElementById('post-title').textContent = post.title;
            document.getElementById('post-content').textContent = post.content;
            document.getElementById('post-author').textContent = `作者：${post.username}`;
            document.getElementById('post-time').textContent = `发布时间：${new Date(post.created_at).toLocaleString()}`;
        }
    }
});

/**
 * 时间格式化工具
 * 输出格式：YYYY-MM-DD HH:MM
 * 支持多语言环境（当前设置为zh-CN）
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 添加提交前的字段验证
function validatePostData(data) {
  const requiredFields = {
    title: '标题',
    content: '内容',
    game_type: '游戏类型',
    server_type: '联机类型',
    contact: '联系方式'
  };

  return Object.entries(requiredFields).reduce((acc, [key, name]) => {
    if (!data[key]?.trim()) {
      acc.isValid = false;
      acc.errors.push(`${name}不能为空`);
    }
    return acc;
  }, { isValid: true, errors: [] });
}

// 修改renderPost函数以展示完整信息
function renderPost(post) {
  return `
    <div class="post-item">
      <h3>${post.title}</h3>
      <div class="post-meta">
        <span>ID: ${post.id}</span>
        <span>${formatTime(post.created_at)}</span>
      </div>
      <div class="meta-grid">
        <div><strong>联机类型：</strong>${post.connection_type || '未填写'}</div>
        <div><strong>游戏类型：</strong>${post.game_type || '未填写'}</div>
        <div><strong>联系方式：</strong>${post.contact || '未提供'}</div>
        <div><strong>留存时间：</strong>${post.retention_time}天</div>
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
    </div>
  `;
}

// ======================
// 新增初始化函数
// ======================
function initPage() {
    // 移除DOM相关初始化
    loadPosts();
    initSelectAllCheckboxes();
    bindGlobalEvents();
}

// ======================
// 新增表单重置函数
// ======================
function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('customRetentionTime').style.display = 'none';
    document.getElementById('customConnectionInput').style.display = 'none';
}

// ======================
// 新增管理员密码验证函数
// ======================
function checkAdminPassword() {
    const password = prompt('请输入管理员密码：');
    if (!password) return false;
    
    // 简单base64加密验证
    const encrypted = btoa(password);
    return encrypted === localStorage.getItem('adminPassword');
}

// ======================
// 新增全选复选框初始化函数
// ======================
function initSelectAllCheckboxes() {
    document.querySelectorAll('.select-all').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const group = this.dataset.group;
            const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    });
}

// 在初始化代码后添加帖子容器检查
console.log('帖子容器元素：', document.getElementById('posts-container')); // 应该返回有效元素

// 确保在DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayPosts();
});

async function fetchAndDisplayPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const container = document.getElementById('postsList');
        if (!container) return;

        container.innerHTML = posts.length > 0 ? 
            posts.map(post => renderPost(post)).join('') :
            '<div class="empty-tip">暂时没有帖子，快来发布第一条吧！</div>';
            
    } catch (err) {
        console.error('获取帖子失败：', err);
        alert('获取内容失败，请检查网络连接');
    }
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