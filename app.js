// 初始化Supabase
const supabase = createClient(
  'https://jzpcrdvffrpdyuetbefb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM'
);

// ======================
// 核心功能函数
// ======================

// 加载并显示帖子列表
function loadPosts() {
  supabase
    .from('posts')
    .select('*')
    .then(({ data: posts }) => {
      const container = document.getElementById('postsList');
      container.innerHTML = posts.map(post => `
        <div class="post-item">
          <h3>${post.title}</h3>
          <p>${post.content}</p>
          <button onclick="location.href='post.html?id=${post.id}'">查看详情</button>
        </div>
      `).join('');
    })
    .catch(error => console.error('加载失败:', error));
}

// 暴露到全局
window.loadPosts = loadPosts;

// 根据筛选条件过滤帖子
function filterPosts() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const searchContact = document.getElementById('searchContact').checked;
    const { posts } = getStoredPosts();
    
    // 获取所有筛选条件
    const selectedPlaystyles = getCheckedValues('filter-playstyle');
    const selectedVersions = getCheckedValues('filter-version');
    const selectedLoaders = getCheckedValues('filter-loader');
    const selectedConnections = getCheckedValues('filter-connection');
    const selectedSaves = getCheckedValues('filter-save');
    const selectedServers = getCheckedValues('filter-server');
    const selectedReports = getCheckedValues('filter-report');

    const filteredPosts = posts.filter(post => {
        const matchesSearch = searchText === '' || 
            post.title.toLowerCase().includes(searchText) || 
            post.content.toLowerCase().includes(searchText) ||
            (searchContact && post.contact.toLowerCase().includes(searchText));
        
        const matchesPlaystyles = checkMatch(selectedPlaystyles, post.playstyles);
        const matchesVersion = checkMatch(selectedVersions, post.version);
        const matchesLoader = checkMatch(selectedLoaders, post.loader);
        const matchesConnection = checkMatch(selectedConnections, post.connectionType);
        const matchesSave = checkMatch(selectedSaves, post.saveType);
        const matchesServer = checkMatch(selectedServers, post.serverType);
        const matchesReport = checkReport(selectedReports, post.reported);

        // 新增时间筛选检查
        const postTime = new Date(post.timestamp).getTime();
        let timeValid = true;
        
        if (currentTimeFilter) {
            if (typeof currentTimeFilter === 'object') { // 自定义时间范围
                timeValid = postTime >= currentTimeFilter.start.getTime() && 
                          postTime <= currentTimeFilter.end.getTime();
            } else { // 快速时间筛选
                const cutoffTime = new Date().getTime() - currentTimeFilter * 60000;
                timeValid = postTime >= cutoffTime;
            }
        }
        
        return timeValid && matchesSearch && matchesPlaystyles && matchesVersion && 
               matchesLoader && matchesConnection && matchesSave && 
               matchesServer && matchesReport;
    });

    displayPosts(filteredPosts);
}

// 显示过滤后的帖子
function displayPosts(posts) {
    const container = document.getElementById('postsList');
    container.innerHTML = '';
    const isAdminPage = window.location.pathname.includes('admin.html');

    posts.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post-item';
        postEl.innerHTML = `
            <h3>${post.title}</h3>
            <p class="post-meta">
                版本：${post.version} 
                ${post.loader ? `| 加载器：${post.loader}` : ''}
                | 发布时间：${post.timestamp}
            </p>
            <p class="post-meta">
                游戏类型：${post.gameType} | 
                存档类型：${post.saveType}
            </p>
            <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
            ${post.playstyles ? `<div class="playstyles">玩法：${post.playstyles}</div>` : ''}
            <div class="contact-info">📧 联系方式：${post.contact}</div>
            <button class="view-detail-btn" data-id="${post.id}">查看详情</button>
            ${isAdminPage ? `
                <button class="delete-btn" data-id="${post.id}">删除帖子</button>
                ${post.reported ? `
                    <button class="restore-btn" data-id="${post.id}">恢复状态</button>
                    <div class="report-status">⚠️ 已举报</div>
                ` : ''}
            ` : ''}
            ${!isAdminPage ? `<button class="report-btn" data-id="${post.id}">举报</button>` : ''}
        `;
        container.appendChild(postEl);
    });

    // 绑定查看详情事件
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', handleViewDetail);
    });

    // 如果是管理员页面，绑定删除帖子事件
    if (isAdminPage) {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeletePost);
        });
    }

    // 举报功能
    function handleReport(e) {
        const postId = e.target.dataset.id;
        const reason = prompt('请输入举报原因：');
        if (reason) {
            // 更新帖子状态
            const storage = getStoredPosts();
            const post = storage.posts.find(p => p.id == postId);
            if (post) {
                post.reported = true;
                localStorage.setItem('mcPosts', JSON.stringify(storage));
            }

            // 更新UI
            e.target.disabled = true;
            e.target.textContent = '已举报';
            e.target.style.backgroundColor = '#ccc';
            
            // 隐藏被举报的帖子
            const postEl = e.target.closest('.post-item');
            if (postEl) {
                postEl.style.display = 'none';
            }

            alert(`已举报帖子 ${postId}，原因：${reason}`);
        }
    }

    // 绑定举报按钮事件
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', handleReport);
    });

    // 绑定恢复按钮事件
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            handleRestoreReport(this.dataset.id);
        });
    });
}

// 获取本地存储的帖子数据
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

// 主表单提交处理
document.getElementById('postForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const versionSelect = document.getElementById('version');
    const versionInput = versionSelect.value === '其他' ? 
        prompt('请输入您的游戏版本号：') : 
        versionSelect.value;

    const playstyles = Array.from(document.querySelectorAll('input[name="playstyle"]:checked'))
        .map(input => input.value)
        .join(', ');

    const loaderValue = document.getElementById('loader').value;
    const retentionTimeSelect = document.getElementById('retentionTime');
    let retentionTime;
    if (retentionTimeSelect.value === 'custom') {
        retentionTime = confirmCustomRetention();
        if (retentionTime === null) {
            // 高亮显示输入框
            document.getElementById('customDays').style.border = '2px solid red';
            return;
        }
    } else {
        retentionTime = retentionTimeSelect.value;
    }

    // 检查留存时间是否有效
    if (retentionTime <= 0) {
        alert('留存时间必须大于0');
        return;
    }

    // 获取当前最大编号并累加
    const storage = getStoredPosts();
    const maxId = storage.posts.length > 0 ? Math.max(...storage.posts.map(post => post.id)) : 0;
    const postCounter = maxId + 1;

    const newPost = {
        id: Date.now(),
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        version: versionInput || versionSelect.value,
        serverType: document.getElementById('serverType').value,
        connectionType: document.getElementById('connectionType').value,
        gameType: document.getElementById('gameType').value,
        saveType: document.getElementById('saveType').value,
        playstyles,
        loader: loaderValue === '我不知道' ? '' : loaderValue,
        contact: document.getElementById('contact').value.trim(),
        timestamp: new Date().toLocaleString('zh-CN'),
        retentionTime: Number(retentionTime),
        reported: false,
    };

    if (!validatePost(newPost)) return;

    if (savePost(newPost)) {
        resetForm();
        loadPosts();
    }
});

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
    return selected.length === 0 || selected.includes(value);
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

    // 如果点击已激活的按钮，则取消筛选
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        currentTimeFilter = null;
        activeTimeButton = null;
    } else {
        // 移除之前激活按钮的样式
        if (activeTimeButton) {
            activeTimeButton.classList.remove('active');
        }

        // 设置当前激活按钮
        button.classList.add('active');
        activeTimeButton = button;

        const now = new Date();
        const timeAgo = new Date(now.getTime() - minutes * 60000);
        currentTimeFilter = timeAgo;
    }
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
    const postId = e.target.dataset.id;
    location.href = `post.html?id=${postId}`;
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
// 管理员功能
// ======================

// 密码管理
function encryptPassword(pwd) {
    return btoa(pwd); // 使用base64简单加密
}

// 在 app.js 顶部定义全局变量
let isAdminAuthenticated = false;

function checkAdminPassword() {
    // 如果已经认证，直接返回 true
    if (isAdminAuthenticated) return true;

    const storedPwd = localStorage.getItem('adminPwd');
    if (!storedPwd) {
        let initPwd;
        do {
            initPwd = prompt('首次使用请设置管理员密码（至少6位）：');
            if (initPwd && initPwd.length < 6) {
                alert('密码长度不足，至少需要6位');
            }
        } while (initPwd && initPwd.length < 6);
        
        if (initPwd) {
            localStorage.setItem('adminPwd', encryptPassword(initPwd));
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            isAdminAuthenticated = true;
            return true;
        }
        return false;
    }

    const inputPwd = prompt('请输入管理员密码：');
    if (encryptPassword(inputPwd) === storedPwd) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        isAdminAuthenticated = true;
        return true;
    }
    alert('密码错误！');
    return false;
}

function resetAdminPassword() {
    if (!checkAdminPassword()) {
        alert('请先验证当前管理员密码');
        return;
    }
    
    const newPassword = prompt('请输入新密码（至少6位）：');
    if (newPassword && newPassword.length >= 6) {
        localStorage.setItem('adminPwd', encryptPassword(newPassword));
        alert('密码已重置');
    } else if (newPassword) {
        alert('密码长度不足，至少需要6位');
        resetAdminPassword();
    } else {
        alert('密码重置已取消');
    }
}

// 管理员页面初始化
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

// ======================
// 事件监听初始化
// ======================
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('postsList')) {
        loadPosts();
    }
});

// 在 app.js 中添加 resetForm 函数
function resetForm() {
    const form = document.getElementById('postForm');
    if (form) {
        form.reset(); // 重置表单字段

        // 手动处理特殊字段
        const customConnectionInput = document.getElementById('customConnectionInput');
        if (customConnectionInput) {
            customConnectionInput.style.display = 'none';
        }

        const customRetentionTime = document.getElementById('customRetentionTime');
        if (customRetentionTime) {
            customRetentionTime.style.display = 'none';
        }

        // 重置复选框
        const playstyleCheckboxes = document.querySelectorAll('input[name="playstyle"]');
        playstyleCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
}

// 添加初始化检查
if (!window.supabase) {
  console.error('Supabase未正确初始化！');
} else {
  console.log('Supabase已初始化:', window.supabase);
}