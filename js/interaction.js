import { supabaseClient } from './app.js';

/**
 * @file 用户交互处理模块，包含帖子操作相关逻辑
 * @module interaction
 */

// 查看详情处理
export function handleViewDetail(e) {
    const postId = e.target.dataset.postId;
    if (postId) {
        window.location.href = `post.html?id=${postId}`;
    }
}

// 举报功能
export async function handleReport(e) {
    const postId = e.target.dataset.id;
    if (!postId) return;

    try {
        const reason = prompt('请输入举报原因（可选）:');
        const confirmDelete = confirm('确认要举报该内容吗？');
        if (!confirmDelete) return;

        const { error } = await supabaseClient
            .from('reports')
            .insert([{
                post_id: postId,
                reason: reason || '不良信息',
                reported_at: new Date().toISOString()
            }]);

        if (error) throw error;
        
        e.target.disabled = true;
        e.target.textContent = '已举报';
        alert('举报已提交！');
    } catch (error) {
        console.error('举报失败:', error);
        alert('举报失败: ' + error.message);
    }
}

// 删除功能（管理员）
export async function handleDeletePost(e) {
    const postId = e.target.dataset.id;
    if (!postId || !confirm('确定要删除该帖子吗？')) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
        
        alert('删除成功！');
        window.location.reload();
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
    }
}

/**
 * 处理帖子恢复操作
 * @function handleRestoreReport
 * @param {string} postId - 要恢复的帖子ID
 * @returns {Promise<void>}
 * @example
 * // 恢复ID为'abc123'的帖子
 * await handleRestoreReport('abc123');
 */
export async function handleRestoreReport(postId) {
    try {
        const { error } = await supabaseClient
            .from('posts')
            .update({ reported: false })
            .eq('id', postId);

        if (error) throw error;
        
        alert('已恢复帖子');
        loadPosts(); // 需要从list.js导入
    } catch (error) {
        console.error('恢复失败:', error);
        alert('恢复失败: ' + error.message);
    }
}

/**
 * 初始化全局交互事件
 * 监听事件类型：click
 * 处理操作类型：
 *   - 查看详情（.view-detail-btn）
 *   - 举报（.report-btn）
 *   - 删除（.delete-btn）
 *   - 恢复（.restore-btn）
 */
export function initInteractions() {
    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('view-detail-btn')) {
            handleViewDetail(e);
        }
        if (e.target.classList.contains('report-btn')) {
            handleReport(e);
        }
        if (e.target.classList.contains('delete-btn')) {
            handleDeletePost(e);
        }
        if (e.target.classList.contains('restore-btn')) {
            handleRestoreReport(e.target.dataset.id);
        }
    });
}

// 全局事件绑定转移到各模块
export function bindGlobalEvents() {
    document.body.addEventListener('click', handleGlobalClick);
} 