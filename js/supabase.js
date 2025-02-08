/**
 * @file Supabase客户端配置
 * @module supabase
 */

// 在文件顶部添加浏览器环境检查
if (typeof window === 'undefined') {
    throw new Error('此模块仅限浏览器环境使用');
}

// 在文件顶部添加环境变量检查
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error(`
        缺少Supabase配置！请检查：
        1. 项目根目录下是否有.env.local文件
        2. 文件中是否包含：
           VITE_SUPABASE_URL=您的Supabase_URL
           VITE_SUPABASE_ANON_KEY=您的公开anon密钥
    `);
}

// 修改supabase.js的导入方式
// 移除原有import语句，改为CDN直接引入
const { createClient } = supabase;

// 保持配置不变
const supabaseConfig = {
    url: "https://jzpcrdvffrpdyuetbefb.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM"
};

// 验证配置
if (!supabaseConfig.url || !supabaseConfig.key) {
    throw new Error("数据库配置错误，请联系管理员");
}

export const supabaseClient = createClient(supabaseConfig.url, supabaseConfig.key); 