// 在文件顶部添加
function loadPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    const { posts } = getStoredPosts();
    const isAdminPage = window.location.pathname.includes('admin.html');

    // 过滤被举报的帖子（管理员页面除外）
    const filteredPosts = isAdminPage ? posts : posts.filter(post => !post.reported);

    // 在加载帖子时添加兼容处理
    const postsWithCompatibility = filteredPosts.map(post => {
        // 旧数据兼容处理
        if (!post.saveType) {
            post.saveType = post.gameType === "新存档" || post.gameType === "现有存档" 
                ? post.gameType 
                : "未指定";
            post.gameType = post.gameType === "新存档" || post.gameType === "现有存档" 
                ? "原版" 
                : post.gameType;
        }
        if (!post.connectionType) {
            post.connectionType = post.serverType || '未指定';
        }
        return post;
    });

    postsWithCompatibility.forEach(post => {
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
            ${isAdminPage ? `<button class="delete-btn" data-id="${post.id}">删除帖子</button>` : ''}
            ${!isAdminPage ? `<button class="report-btn" data-id="${post.id}">举报</button>` : ''}
            ${isAdminPage && post.reported ? `<div class="report-status">已举报</div>` : ''}
            ${isAdminPage && post.reported ? `<button class="restore-btn" data-id="${post.id}">恢复帖子</button>` : ''}
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

// 确保在函数定义后导出到全局
window.loadPosts = loadPosts;

// 其他全局函数
window.filterPosts = function() {
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
};

// 保持其他事件监听器不变
document.addEventListener('DOMContentLoaded', () => {
    // 通用初始化代码
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                filterPosts();
            }
        });
    }

    // 仅在有搜索按钮的页面绑定
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', filterPosts);
    }

    // 仅在存在版本筛选的页面绑定
    const otherVersionCheckbox = document.querySelector('input[name="filter-version"][value="其他"]');
    if (otherVersionCheckbox) {
        otherVersionCheckbox.addEventListener('change', function() {
            document.getElementById('otherVersionInput').style.display = this.checked ? 'block' : 'none';
        });
    }

    // 自动加载帖子（适用于所有有帖子列表的页面）
    if (document.getElementById('postsList')) {
        loadPosts();
    }
    
    // 管理员页面初始化
    initAdminPage();

    // 修改全选功能
    document.querySelectorAll('.select-all').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const group = this.dataset.group;
            document.querySelectorAll(`input[name="${group}"]`).forEach(cb => {
                cb.checked = this.checked;
            });
        });

        // 监听子复选框变化，更新全选状态
        const group = checkbox.dataset.group;
        document.querySelectorAll(`input[name="${group}"]`).forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(document.querySelectorAll(`input[name="${group}"]`))
                    .every(cb => cb.checked);
                checkbox.checked = allChecked;
            });
        });
    });
});

// 替换所有localStorage操作
async function getStoredPosts() {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('timestamp', { ascending: false })
    
    return { posts: data || [] }
}

async function savePost(post) {
    const { error } = await supabase
        .from('posts')
        .insert([post])
    
    if (error) {
        console.error('保存失败:', error)
        return false
    }
    return true
}

// 在 app.js 中添加全局变量来存储当前编号
let postCounter = 0;

// 主页面表单提交
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('postForm')) {
        document.getElementById('postForm').addEventListener('submit', function(e) {
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

            storage.posts.unshift(newPost);
            localStorage.setItem('mcPosts', JSON.stringify(storage));
            
            resetForm();
            loadPosts();
        });
    }
});

function validatePost({title, content, version, contact}) {
    if (!title || !content || !version || !contact) {
        alert('请填写所有必填字段！');
        return false;
    }
    return true;
}

function resetForm() {
    document.getElementById('postForm').reset();
}

// 添加查看详情处理函数
function handleViewDetail(e) {
    const postId = e.target.dataset.id;
    window.location.href = `post.html?id=${postId}`;
}

// 删除帖子处理函数
function handleDeletePost(e) {
    if (!confirm('确定要删除该帖子吗？')) return;

    const postId = Number(e.target.dataset.id);
    if (!postId) return;

    const storage = getStoredPosts();
    storage.posts = storage.posts.filter(post => post.id !== postId);
    localStorage.setItem('mcPosts', JSON.stringify(storage));

    loadPosts(); // 重新加载帖子列表
}

// 加密函数
function encryptPassword(pwd) {
    return btoa(pwd); // 使用base64简单加密
}

// 在 checkAdminPassword 函数后添加 resetAdminPassword 函数
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

// 修改管理员状态存储方式
let isAdminAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';

function checkAdminPassword() {
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

// 修改 handleVersionChange 函数
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

// 在 app.js 中添加处理自定义版本号的函数
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

// 修改时间筛选相关函数
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

// 添加取消时间筛选的函数
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

// 通用检查函数
function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value);
}

function checkMatch(selected, value) {
    return selected.length === 0 || selected.includes(value);
}

function checkReport(selected, isReported) {
    return selected.length === 0 || 
        (selected.includes('已举报') && isReported) ||
        (selected.includes('未举报') && !isReported);
}

function displayPosts(posts) {
    const container = document.getElementById('postsList');
    container.innerHTML = '';

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
        `;
        container.appendChild(postEl);
    });

    // 绑定查看详情事件
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', handleViewDetail);
    });
}

// 处理留存时间选择变化
function handleRetentionTimeChange(select) {
    const customRetentionDiv = document.getElementById('customRetentionTime');
    if (select.value === 'custom') {
        customRetentionDiv.style.display = 'block';
    } else {
        customRetentionDiv.style.display = 'none';
    }
}

// 修改确认自定义留存时间函数
function confirmCustomRetention() {
    const customDays = document.getElementById('customDays').value;
    if (!customDays || customDays < 1) {
        alert('请输入有效的天数');
        return null;
    }
    return customDays * 1440; // 返回分钟数
}

// 处理联机方式选择变化
function handleConnectionTypeChange(select) {
    const customInput = document.getElementById('customConnectionInput');
    customInput.style.display = select.value === '其他' ? 'block' : 'none';
}

// 添加自定义联机方式
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

// 取消全选
function deselectAll() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 修改恢复函数
function handleRestoreReport(postId) {
    if (!isAdminAuthenticated && !checkAdminPassword()) return;
    
    const storage = getStoredPosts();
    const post = storage.posts.find(p => p.id == postId);
    if (post) {
        post.reported = false;
        localStorage.setItem('mcPosts', JSON.stringify(storage));
        location.reload();
    }
}

// 修改管理员页面加载逻辑，移除全局作用域中的return
function initAdminPage() {
    if (window.location.pathname.includes('admin.html')) {
        // 检查sessionStorage中的认证状态
        isAdminAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
        
        if (!isAdminAuthenticated && !checkAdminPassword()) {
            window.location.href = 'index.html';
            return; // ✅ 现在在函数作用域内
        }
        
        // 加载完成后保持认证状态
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        isAdminAuthenticated = true;
        
        // 初始化筛选器
        initializeFilters();
    }
}
document.addEventListener('DOMContentLoaded', initAdminPage);