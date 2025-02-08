// 发帖相关功能
export async function submitPost(formData) {
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .insert([formData])
            .select();

        if (error) {
            throw new Error(`数据库错误: ${error.message}`);
        }
        
        return {
            success: true,
            postId: data[0]?.id
        };
    } catch (error) {
        console.error('发帖失败:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// 独立表单重置逻辑
export function resetPostForm() {
    const form = document.getElementById('postForm');
    if (form) {
        form.reset();
        document.querySelectorAll('.dynamic-field').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// 独立版本选择处理
function handleVersionSelect() {
    const select = document.getElementById('version');
    return select.value === '其他' ? 
        prompt('请输入自定义版本') : 
        select.value;
} 