docker pull mcr.microsoft.com/mssql/server:2019-latest

docker scout quickview mcr.microsoft.com/mssql/server:2019-latest 

docker run -d ^
  --name sqlserver-developer ^
  -e ACCEPT_EULA=Y ^
  -e MSSQL_SA_PASSWORD="iisi@641001" ^
  -e MSSQL_PID=Developer ^
  -p 1433:1433 ^
  -v C:\Users\User\Desktop\Project\Chatbot\sqlserver ^
  mcr.microsoft.com/mssql/server:2019-latest
  
docker run --rm -it --network container:sqlserver-developer mcr.microsoft.com/mssql-tools /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "iisi@641001" -d master -Q "IF DB_ID('Chatbot') IS NULL CREATE DATABASE [Chatbot]; "
docker run --rm -it --network container:sqlserver-developer mcr.microsoft.com/mssql-tools /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "iisi@641001" -d master -Q "IF SUSER_ID('manager') IS NULL CREATE LOGIN [manager] WITH PASSWORD='iisi@641001', CHECK_POLICY=ON, CHECK_EXPIRATION=OFF, DEFAULT_DATABASE=[Chatbot]; USE [Chatbot]; IF USER_ID('manager') IS NULL CREATE USER [manager] FOR LOGIN [manager]; IF IS_ROLEMEMBER('db_owner','manager') <> 1 ALTER ROLE [db_owner] ADD MEMBER [manager];"

  
