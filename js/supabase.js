/**
 * @file Supabase客户端配置
 * @module supabase
 */

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