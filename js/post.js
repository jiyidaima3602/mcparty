// 在文件顶部添加导入
import { supabaseClient } from '/js/supabase.js';

// 在文件顶部添加全局变量
let postCounter = parseInt(localStorage.getItem('postCounter')) || 0;

// 发帖相关功能
(function() {
    window.submitPost = async function(formData) {
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

            // 获取 Supabase 自动生成的 ID
            const postId = data[0]?.id;

            // 在联机详情文本顶部插入ID
            const updatedContent = `帖子ID: ${postId}\n\n${formData.content}`;

            // 更新帖子内容，插入 ID
            const { error: updateError } = await supabaseClient
                .from('posts')
                .update({ content: updatedContent })
                .eq('id', postId);

            if (updateError) {
                throw new Error(`更新帖子内容失败: ${updateError.message}`);
            }
            
            return {
                success: true,
                postId: postId
            };
        } catch (error) {
            console.error('发帖失败:', error);
            return {
                success: false,
                message: error.message
            };
        }
    };

    // 独立表单重置逻辑
    window.resetPostForm = function() {
        const form = document.getElementById('postForm');
        if (form) {
            form.reset();
            document.querySelectorAll('.dynamic-field').forEach(el => {
                el.style.display = 'none';
            });
        }
    };

    // 独立版本选择处理
    window.handleVersionSelect = function() {
        const select = document.getElementById('version');
        return select.value === '其他' ? 
            prompt('请输入自定义版本') : 
            select.value;
    };

    // 初始化表单事件
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('postForm');
        if (form) {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                // 添加加载状态提示
                const submitBtn = form.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '提交中...';
                
                try {
                    const result = await handleSubmit();
                    if (result && result.success) {
                        alert('帖子提交成功！');
                        window.location.href = 'browse.html';
                    } else if (result) {
                        alert(`提交失败：${result.message}`);
                    }
                } catch (error) {
                    console.error('提交异常:', error);
                    alert('提交过程中发生错误，请查看控制台');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '发布帖子';
                }
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
    });

    // 表单提交处理
    window.handleSubmit = async function() {
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

        // 在收集数据后添加验证
        if (!formData.title.trim()) {
            alert('请输入帖子标题');
            return;
        }
        
        // 其他验证逻辑...
        
        // 在最后添加错误处理
        try {
            return await window.submitPost(formData);
        } catch (error) {
            console.error('表单处理错误:', error);
            return {
                success: false,
                message: error.message || '未知错误'
            };
        }
    };

    // 添加处理联机方式变化的函数
    window.handleConnectionTypeChange = function(select) {
        const customInput = document.getElementById('customConnectionInput');
        customInput.style.display = select.value === '其他' ? 'block' : 'none';
    };

    // 添加处理留存时间变化的函数
    window.handleRetentionTimeChange = function(select) {
        const customInput = document.getElementById('customRetentionTime');
        customInput.style.display = select.value === 'custom' ? 'block' : 'none';
    };
})(); 