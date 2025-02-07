# mcparty
用于mc招募和寻找联机伙伴的小型站点

## 区块链集成指南

### 环境要求
- Substrate节点 v4.0+
- Rust nightly工具链
- PostgreSQL数据库

### 部署步骤
1. 克隆定制链代码库
2. 编译节点：`cargo build --release`
3. 启动节点：`./target/release/your-node --dev`
