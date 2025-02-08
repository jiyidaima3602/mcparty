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

// 从环境变量读取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 添加环境变量验证
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    Supabase配置缺失！请检查是否在.env.local文件中设置了：
    VITE_SUPABASE_URL=您的Supabase_URL
    VITE_SUPABASE_ANON_KEY=您的公开anon密钥
  `);
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey); 