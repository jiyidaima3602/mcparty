// 发帖相关功能
async function submitPost() {
    // 获取所有表单字段
    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        version: handleVersionSelect(), // 处理版本选择
        gameType: document.getElementById('gameType').value,
        // ...其他字段
    };

    // 完整验证逻辑
    if (!validatePost(formData)) return;

    // Supabase插入操作
    const { data, error } = await supabase
        .from('posts')
        .insert([{ ...formData }]);

    // 提交后处理
    if (!error) {
        resetForm();
        window.location.href = 'browse.html'; 
    }
}

// 独立版本选择处理
function handleVersionSelect() {
    const select = document.getElementById('version');
    return select.value === '其他' ? 
        prompt('请输入自定义版本') : 
        select.value;
} 