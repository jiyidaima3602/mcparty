import { supabaseClient, fetchPostsFromSupabase } from './app.js';

// 管理员状态
let isAdminAuthenticated = false;

// 初始化管理员页面
export function initAdminPage() {
    checkSessionAuth();
    bindAdminEvents();
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
    const password = prompt('请输入管理员密码：');
    if (!password) return false;
    
    // 从Supabase获取加密后的密码
    const { data, error } = await supabaseClient
        .from('admin')
        .select('password_hash')
        .single();

    if (error) {
        console.error('获取密码失败:', error);
        return false;
    }
    
    return bcrypt.compareSync(password, data.password_hash);
}

// 加载管理界面帖子
async function loadAdminPosts() {
    try {
        const posts = await fetchPostsFromSupabase();
        renderAdminPosts(posts);
    } catch (error) {
        console.error('加载失败:', error);
        alert('帖子加载失败');
    }
}

// 渲染管理员视图
function renderAdminPosts(posts) {
    const container = document.getElementById('adminPosts');
    container.innerHTML = posts.map(post => `
        <div class="admin-post">
            <h4>${post.title} (ID: ${post.id})</h4>
            <p>${post.content.substring(0, 50)}...</p>
            <div class="admin-actions">
                <button class="delete-btn" data-id="${post.id}">删除</button>
                <button class="view-btn" data-id="${post.id}">查看详情</button>
            </div>
        </div>
    `).join('');
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