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

import { createClient } from '@supabase/supabase-js';

// 移除Vite环境变量依赖，改为直接配置
const supabaseConfig = {
    url: "https://jzpcrdvffrpdyuetbefb.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM"
};

// 添加配置验证
if (!supabaseConfig.url || !supabaseConfig.key) {
    throw new Error("Supabase配置信息不完整，请检查数据库连接配置");
}

export const supabaseClient = createClient(supabaseConfig.url, supabaseConfig.key); 