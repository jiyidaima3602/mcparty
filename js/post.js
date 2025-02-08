// 发帖相关功能
export async function submitPost(formData) {
    try {
        // 添加数据验证
        const requiredFields = ['title', 'content', 'version', 'game_type', 'server_type'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                throw new Error(`必填字段 ${field} 不能为空`);
            }
        }

        // 处理空值情况
        const postData = {
            ...formData,
            playstyles: formData.playstyles || '无',
            loader: formData.loader || '无',
            retention_time: formData.retention_time || 1440 // 默认1天
        };

        const { data, error } = await supabaseClient
            .from('posts')
            .insert([postData])
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

// 初始化表单事件
export function initPostForm() {
    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleSubmit();
        });

        // 添加版本选择事件
        document.getElementById('version').addEventListener('change', function() {
            handleVersionSelect(this);
        });
        
        // 添加联机方式选择事件
        document.getElementById('connectionType').addEventListener('change', function() {
            handleConnectionTypeChange(this);
        });
        
        // 添加留存时间选择事件
        document.getElementById('retentionTime').addEventListener('change', function() {
            handleRetentionTimeChange(this);
        });
    }
}

// 表单提交处理
async function handleSubmit() {
    // 修改版本获取方式
    const version = document.getElementById('version').value === '其他' ?
        prompt('请输入自定义版本') :
        document.getElementById('version').value;

    // 收集多选玩法
    const playstyles = Array.from(document.querySelectorAll('input[name="playstyle"]:checked'))
                           .map(checkbox => checkbox.value)
                           .join(',');

    // 处理自定义联机方式
    const connectionType = document.getElementById('connectionType').value === '其他' ?
        document.getElementById('customConnection').value :
        document.getElementById('connectionType').value;

    // 处理自定义留存时间
    const retentionTime = document.getElementById('retentionTime').value === 'custom' ?
        parseInt(document.getElementById('customDays').value) * 1440 : // 将天数转换为分钟
        parseInt(document.getElementById('retentionTime').value);

    const customConnection = document.getElementById('customConnection').value;
    if (document.getElementById('connectionType').value === '其他' && !customConnection) {
        alert('请输入自定义联机方式');
        return;
    }

    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        version: version,  // 使用新的版本获取方式
        game_type: document.getElementById('gameType').value,
        server_type: document.getElementById('serverType').value,
        connection_type: connectionType,
        save_type: document.getElementById('saveType').value,
        playstyles: playstyles,
        contact: document.getElementById('contact').value,
        loader: document.getElementById('loader').value,
        retention_time: retentionTime
    };

    return submitPost(formData);
}

// 添加处理联机方式变化的函数
export function handleConnectionTypeChange(select) {
    const customInput = document.getElementById('customConnectionInput');
    customInput.style.display = select.value === '其他' ? 'block' : 'none';
}

// 添加处理留存时间变化的函数
export function handleRetentionTimeChange(select) {
    const customInput = document.getElementById('customRetentionTime');
    customInput.style.display = select.value === 'custom' ? 'block' : 'none';
}

// 修改后的导出列表
export { 
    handleVersionSelect,
    handleConnectionTypeChange,
    handleRetentionTimeChange
}; 