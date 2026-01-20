# 🚀 Guia de Deploy - Legal System

Este guia explica como colocar seu projeto online usando um servidor **VPS** (Virtual Private Server).

## 1. Requisitos
*   **Servidor VPS** com **Ubuntu 22.04** ou **24.04**.
    *   **Recomendação (Hostinger):** Plano **KVM 1** (4GB RAM) é suficiente e oferece ótimo custo-benefício.
    *   Outras opções: DigitalOcean ($6/mês), Hetzner (€5/mês).
    *   Configuração mínima: 2GB RAM.
*   **Chave da API do Gemini**.

## 2. Preparando o Servidor
Após comprar o servidor, você receberá um **IP** (ex: `192.168.1.100`) e uma senha de `root`.

## 3. Enviando os arquivos
Você precisa copiar os arquivos do seu computador para o servidor.
No **PowerShell** do seu computador (dentro da pasta do projeto), rode:

```powershell
# Substitua IP_DO_SERVIDOR pelo IP real do seu servidor
# O comando pedirá a senha do servidor
scp -r backend frontend docker-compose.yml deploy.sh root@IP_DO_SERVIDOR:/root/app
```

> **Nota:** Se o comando `scp` der erro, você pode usar um programa como **FileZilla** ou **WinSCP** para arrastar os arquivos para a pasta `/root/app` do servidor.

## 4. Configurando e Rodando
1.  Acesse o servidor via SSH:
    ```powershell
    ssh root@IP_DO_SERVIDOR
    ```
2.  Entre na pasta:
    ```bash
    cd /root/app
    ```
3.  Configure a chave do Gemini:
    *   Copie o exemplo: `cp backend/.env.example backend/.env`
    *   Edite o arquivo: `nano backend/.env`
    *   Cole sua `GEMINI_API_KEY` e salve (Ctrl+O, Enter, Ctrl+X).
4.  Rode o script de deploy:
    ```bash
    chmod +x deploy.sh
    ./deploy.sh
    ```

## 6. Banco de Dados e Backups
O banco de dados (**PostgreSQL**) já está incluído no seu Docker Compose.
*   **Onde ficam os dados?** Eles são salvos numa pasta segura do servidor (Docker Volume), então mesmo se você reiniciar o computador ou o Docker, **seus dados não somem**.
*   **Backup:** Para fazer backup, basta copiar a pasta do volume ou fazer um "dump" do banco (podemos automatizar isso futuramente).

## 7. Pronto!
Seu site estará acessível em: `http://IP_DO_SERVIDOR`

## 🛡️ Dica Extra: Domínio e HTTPS
Para usar um domínio (ex: `meusistema.com`) e HTTPS (cadeado de segurança):
1.  Aponte o DNS do seu domínio para o IP do servidor.
2.  Use o **Nginx Proxy Manager** ou configure o **Certbot** no container Nginx. (Podemos fazer isso num próximo passo se desejar).
