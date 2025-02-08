import { supabaseClient } from './supabase.js';

/**
 * @file 表单处理模块，包含表单验证和提交逻辑
 * @module form
 */

/**
 * 表单数据验证结果
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否通过验证
 * @property {string[]} errors - 错误信息数组
 */

/**
 * 初始化表单
 * @function initForm
 */
export function initForm() {
    bindFormEvents();
    initDynamicFields();
}

// 绑定表单事件
function bindFormEvents() {
    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    document.getElementById('version')?.addEventListener('change', handleVersionChange);
    document.getElementById('serverType')?.addEventListener('change', handleServerTypeChange);
    document.getElementById('retentionTime')?.addEventListener('change', handleRetentionTimeChange);
}

// 处理表单提交
async function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        version: handleVersionSelect(),
        gameType: document.getElementById('gameType').value,
        serverType: document.getElementById('serverType').value,
        contact: document.getElementById('contact').value,
        retentionTime: document.getElementById('retentionTime').value,
        customRetention: document.getElementById('customRetention').value,
        playstyles: getCheckedValues('playstyle')
    };

    const validation = validatePost(formData);
    if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .insert([formData])
            .select();

        if (error) throw error;
        
        resetForm();
        alert('提交成功！');
        window.location.href = 'browse.html';
    } catch (error) {
        console.error('提交失败:', error);
        alert(`提交失败: ${error.message}`);
    }
}

// 动态字段处理
function initDynamicFields() {
    // 版本选择处理
    function handleVersionSelect() {
        const select = document.getElementById('version');
        if (select.value === '其他') {
            const customVersion = prompt('请输入自定义版本');
            return customVersion || '版本未指定';
        }
        return select.value;
    }

    // 联机类型变化
    function handleServerTypeChange(e) {
        const customInput = document.getElementById('customConnectionInput');
        if (e.target.value === '其他') {
            customInput.style.display = 'block';
            customInput.querySelector('input').required = true;
        } else {
            customInput.style.display = 'none';
            customInput.querySelector('input').required = false;
        }
    }

    // 留存时间变化
    function handleRetentionTimeChange(e) {
        const customDiv = document.getElementById('customRetentionTime');
        customDiv.style.display = e.target.value === 'custom' ? 'block' : 'none';
    }
}

/**
 * 验证表单数据完整性
 * @function validatePost
 * @param {Object} formData - 表单数据对象
 * @param {string} formData.title - 帖子标题
 * @param {string} formData.content - 帖子内容
 * @param {string} formData.version - 游戏版本
 * @param {string} formData.contact - 联系方式
 * @returns {ValidationResult} 验证结果
 * @throws {TypeError} 当输入参数不是对象时
 */
export function validatePost(formData) {
    const errors = [];
    const requiredFields = {
        title: '标题',
        content: '内容',
        version: '游戏版本',
        contact: '联系方式'
    };

    Object.entries(requiredFields).forEach(([key, name]) => {
        if (!formData[key]?.trim()) errors.push(`${name}不能为空`);
    });

    if (formData.retentionTime === 'custom' && !formData.customRetention) {
        errors.push('请输入自定义留存时间');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// 表单重置
export function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('customRetentionTime').style.display = 'none';
    document.getElementById('customConnectionInput').style.display = 'none';
}

// 获取复选框值
function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value);
}

export function validatePostData(formData) { /* ... */ } 