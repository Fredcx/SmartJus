# Configuração do Deploy Automático (GitHub Actions)

Para que o GitHub consiga acessar sua VPS e atualizar o site, você precisa cadastrar 3 "Segredos" (Secrets).

## Passo 1: Pegar os Dados
Você vai precisar de:
1.  **IP da VPS**: (Ex: `192.168.1.100`) - O mesmo que você usa para acessar via SSH.
2.  **Usuário**: Geralmente é `root`.
3.  **Chave SSH Privada**: O conteúdo do seu arquivo de chave (ex: `id_rsa`).
    *   *Se você não tem uma chave SSH para a VPS, você pode criar uma no seu computador com `ssh-keygen -t rsa` e adicionar a parte pública (`id_rsa.pub`) no arquivo `~/.ssh/authorized_keys` da VPS.*

## Passo 2: Cadastrar no GitHub
1.  Vá no seu repositório no GitHub.
2.  Clique em **Settings** (Configurações) > **Secrets and variables** > **Actions**.
3.  Clique no botão verde **New repository secret**.
4.  Adicione os 3 segredos abaixo:

| Nome (Name) | Valor (Secret) |
| :--- | :--- |
| `VPS_HOST` | O IP da sua VPS (ex: `123.45.67.89`) |
| `VPS_USER` | O usuário da VPS (ex: `root`) |
| `VPS_SSH_KEY` | Todo o conteúdo da sua chave privada (Começa com `-----BEGIN OPENSSH PRIVATE KEY-----`) |

## Passo 3: Testar
Assim que adicionar os segredos:
1.  Faça o **Commit** e **Push** dos arquivos que criei (`setup-vps.sh`, `deploy.sh`, `.github/...`, etc.).
2.  Vá na aba **Actions** do GitHub.
3.  Você verá o deploy rodando automaticamente! 🚀

---
> **Nota**: Na primeira vez, o deploy vai copiar os arquivos para `/root/app` e rodar o setup. As próximas vezes serão super rápidas.
