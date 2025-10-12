-- 1) 建立資料庫
CREATE DATABASE [Chatbot];

-- 2) 建立伺服器層登入（Login）
--    請換成強密碼
CREATE LOGIN [manager]
WITH PASSWORD = 'iisi@641001',
     CHECK_POLICY = ON,
     CHECK_EXPIRATION = OFF,
     DEFAULT_DATABASE = [Chatbot];

-- 3) 在 Chatbot 資料庫中建立對應使用者（User）
USE [Chatbot];
CREATE USER [manager] FOR LOGIN [manager];

-- 4) 授與 db_owner 角色
ALTER ROLE [db_owner] ADD MEMBER [manager];


