# 登录与认证功能需求文档 (Authentication Requirements)

本平台在生产环境中的登录机制需严格遵循以下规范，以确保用户信息安全和系统可扩展性。

## 1. 认证架构概述
采用 **OAuth 2.0 + JWT (JSON Web Token)** 的无状态认证架构。
- **前端 (Client)**: 负责展示登录选项、获取授权码并发送给后端、存储解析后的 JWT，并使用拦截器 (Interceptor) 携带 Token 请求受保护资源。
- **后端 (Server)**: 负责与第三方 OAuth 平台交换 Access Token、获取用户资料、在 `users` 表中进行注册/更新、签发系统内部的 JWT，并对敏感路由进行权限校验。

## 2. 登录方式支持
为降低用户注册门槛，系统暂不提供传统的“账号密码”注册，主要依托以下第三方平台：
1. **Google OAuth 2.0**: 面向国际和海外用户。
2. **GitHub OAuth**: 面向开发者和技术型爱好者。
3. **Manus (自定义 OAuth)**: 预留给 Manus 生态链用户的互联登录。

## 3. JWT 签发与生命周期规范
- **算法**: `HS256` (或更安全的 `RS256`)。
- **Payload 规范**: 
  - `sub`: 用户的内部 ID (`users.id`)。
  - `role`: 用户角色 (`user` 或 `admin`)。
  - `exp`: 过期时间 (默认设置 7 天)。
- **存储建议**: 
  - Web 端可优先考虑使用 `HttpOnly` Cookie 存储以防范 XSS 攻击，或存储于 `localStorage` 但配合严格的 CSP 策略。
  - 本次 MVP 阶段，由于采用 `trpc` 和前后端分离，可暂存在 `localStorage`，在请求 Header 中以 `Authorization: Bearer <token>` 携带。

## 4. 路由与接口守卫 (Route Guards)
- 所有 `protectedProcedure` (受保护的接口，如：创建/编辑/删除豆子、发布帖子等) 必须经过 JWT 解析中间件。
- 中间件一旦发现 Token 缺失、伪造或过期，直接返回 `UNAUTHORIZED` 错误。

## 5. 本地开发 (Dev) 策略
在本地缺少真实 OAuth 密钥的情况下，系统允许通过一个名为 `auth.mockLogin` 的开发者专用接口签发测试 Token。该接口在部署到生产环境 (NODE_ENV=production) 时必须被移除或禁用。
