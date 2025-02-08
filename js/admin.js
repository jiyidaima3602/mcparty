import { supabaseClient } from './supabase.js';
import { fetchPostsFromSupabase } from './form.js';
import bcrypt from 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js';

// 管理员状态
let isAdminAuthenticated = false;

// 初始化管理员页面
export function initAdminPage() {
    if (!document.getElementById('adminPosts')) {
        console.error('管理员页面元素缺失');
        return;
    }
    
    checkSessionAuth();
    bindAdminEvents();
    // 添加窗口聚焦时刷新
    window.addEventListener('focus', () => {
        if (isAdminAuthenticated) loadAdminPosts();
    });
}

// 会话认证检查
function checkSessionAuth() {
    const sessionAuth = sessionStorage.getItem('isAdminAuthenticated') === 'true';
    if (sessionAuth) {
        isAdminAuthenticated = true;
        loadAdminPosts();
    } else {
        authenticateAdmin();
    }
}

// 管理员认证流程
async function authenticateAdmin() {
    if (await checkAdminPassword()) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        isAdminAuthenticated = true;
        loadAdminPosts();
    } else {
        window.location.href = 'index.html';
    }
}

// 密码验证
async function checkAdminPassword() {
    const { data } = await supabaseClient
        .from('admin')
        .select('password_hash')
        .single();

    if (data) {
        const password = prompt('请输入管理员密码：');
        if (!password) return false;
        
        return bcrypt.compareSync(password, data.password_hash);
    } else {
        console.error('管理员表不存在');
        return false;
    }
}

// 加载管理界面帖子
async function loadAdminPosts() {
    try {
        const posts = await fetchPostsFromSupabase();
        if (!Array.isArray(posts)) {
            throw new Error('获取到的帖子数据格式不正确');
        }
        renderAdminPosts(posts);
    } catch (error) {
        console.error('加载失败:', error);
        alert(`帖子加载失败: ${error.message}`);
        // 清空容器显示错误
        const container = document.getElementById('adminPosts');
        if (container) {
            container.innerHTML = `<div class="error-tip">加载失败: ${error.message}</div>`;
        }
    }
}

// 渲染管理员视图
function renderAdminPosts(posts) {
    const container = document.getElementById('adminPosts');
    if (!container) {
        console.error('找不到adminPosts容器');
        return;
    }
    
    container.innerHTML = posts.length > 0 
        ? posts.map(post => `
            <div class="admin-post" data-post-id="${post.id}">
                <h4>${post.title} (ID: ${post.id})</h4>
                <p>${post.content.substring(0, 50)}...</p>
                <div class="post-meta">
                    <span>创建时间：${new Date(post.created_at).toLocaleString()}</span>
                    <span class="${post.reported ? 'reported' : ''}">
                        ${post.reported ? '已举报' : '正常'}
                    </span>
                </div>
                <div class="admin-actions">
                    <button class="delete-btn" data-id="${post.id}">删除</button>
                    <button class="view-btn" data-id="${post.id}">查看详情</button>
                </div>
            </div>
        `).join('')
        : '<div class="empty-tip">暂无帖子</div>';
}

// 绑定管理员事件
function bindAdminEvents() {
    document.getElementById('adminPosts').addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        if (e.target.classList.contains('delete-btn')) {
            await handleAdminDelete(postId);
        }
    });
}

// 管理员删除操作
async function handleAdminDelete(postId) {
    if (!confirm('确定要永久删除该帖子吗？')) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
        
        alert('删除成功');
        loadAdminPosts();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

export async function fetchPostsFromSupabase() {
    const { data, error } = await supabaseClient
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        // 添加管理员权限头
        .options({ headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ADMIN_KEY}` } });
    if (error) throw error;
    return data;
} 