import { supabaseClient } from './supabase.js';
import { loadPosts } from './list.js';

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
export async function handleReport(event) {
    const postId = event.target.dataset.id;
    if (!postId) return;

    const confirmReport = confirm('确定要举报该帖子吗？');
    if (!confirmReport) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .update({ 
                reported: true,
                reported_at: new Date().toISOString()
            })
            .eq('id', postId);

        if (error) throw error;

        event.target.disabled = true;
        event.target.textContent = '已举报';
        event.target.classList.add('reported');
        showToast('举报已提交，管理员将会审核处理', 'success');
    } catch (error) {
        console.error('举报失败:', error);
        showToast('举报失败，请稍后重试', 'error');
    }
}

// 删除功能（管理员）
export async function handleDeletePost(postId) {
    if (!confirm('确定要永久删除这个帖子吗？此操作不可撤销！')) return;
    
    try {
        // 转换ID类型为数字
        const numericId = Number(postId);
        if (isNaN(numericId)) throw new Error('无效的帖子ID');

        console.log('正在删除帖子ID:', numericId);
        
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', numericId);  // 确保类型匹配

        console.log('删除操作完成', error ? '有错误' : '成功');
        
        if (error) throw error;
        alert('删除成功');
        loadPosts(); 
    } catch (error) {
        console.error('删除失败详情:', {
            error,
            postId,
            type: typeof postId,
            converted: Number(postId)
        });
        alert(`删除失败: ${error.message}`);
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
        if (e.target.closest('.view-detail-btn')) {
            handleViewDetail(e);
        }
        if (e.target.closest('.report-btn')) {
            handleReport(e);
        }
        if (e.target.closest('.delete-btn')) {
            // 移除此处的事件处理，统一由handleGlobalClick处理
        }
        if (e.target.closest('.restore-btn')) {
            handleRestoreReport(e.target.dataset.id);
        }
    });
}

// 统一全局点击处理
export function handleGlobalClick(event) {
    // 处理返回按钮
    if(event.target.closest('.back-btn')) {
        history.back();
        return;
    }
    
    // 处理删除按钮
    const deleteBtn = event.target.closest('.delete-btn');
    if (deleteBtn) {
        event.stopImmediatePropagation(); // 阻止其他监听器
        const postId = deleteBtn.dataset.id;
        handleDeletePost(postId);
        return false;
    }
}

// 确保所有交互功能都独立导出
export { 
    // handleViewDetail,  // 已单独导出
    // handleReport,      // 已单独导出
    // handleDeletePost,  // 已单独导出
    // handleRestoreReport, // 已单独导出
    handleGlobalClick as bindGlobalEvents
}; 