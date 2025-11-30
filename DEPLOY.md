# Guia de Deploy - Brindaria V2

Este guia descreve como colocar a aplicação no ar em um servidor Debian 12 com Nginx e PM2.

## Pré-requisitos
- Acesso SSH ao servidor como `root` ou usuário com `sudo`.
- Domínio `v2.brindaria.com.br` apontando para o IP do servidor.

## Passo 1: Preparar o Repositório
Certifique-se de que suas alterações locais foram enviadas para o GitHub:
```bash
git push origin main
```

## Passo 2: Executar Script de Instalação
No servidor, você pode usar o script automatizado que criei em `deploy/setup.sh`.

1.  **Clone ou baixe o repositório no servidor** (se ainda não tiver):
    ```bash
    git clone https://github.com/dmknob/brindaria-js.git /var/www/brindaria-v2
    ```

2.  **Dê permissão de execução ao script**:
    ```bash
    chmod +x /var/www/brindaria-v2/deploy/setup.sh
    ```

3.  **Execute o script**:
    ```bash
    sudo /var/www/brindaria-v2/deploy/setup.sh
    ```

Este script irá:
- Atualizar o sistema.
- Instalar Node.js 20, Nginx e Git.
- Instalar PM2 (gerenciador de processos).
- Instalar as dependências do projeto (`npm ci`).
- Configurar o Nginx com o arquivo `deploy/nginx.conf`.
- Iniciar a aplicação com PM2.

## Passo 3: Configurar SSL (HTTPS)
Para ativar o HTTPS gratuito com Let's Encrypt, execute:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d v2.brindaria.com.br
```
Siga as instruções na tela. O Certbot ajustará automaticamente a configuração do Nginx.

## Passo 4: Variáveis de Ambiente
O script cria um arquivo `.env` básico. Edite-o para definir seus segredos de produção:

```bash
nano /var/www/brindaria-v2/.env
```
Ajuste `SESSION_SECRET` e outras variáveis se necessário. Reinicie a aplicação após alterar:
```bash
pm2 restart brindaria-v2
```

## Comandos Úteis
- **Ver logs**: `pm2 logs brindaria-v2`
- **Reiniciar app**: `pm2 restart brindaria-v2`
- **Status**: `pm2 status`
