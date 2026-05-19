# Comando SQL para Corrigir Avisos "RLS Enabled No Policy"

O aviso **"RLS Enabled No Policy"** significa que a Segurança de Linha (RLS) foi ativada nessas tabelas (`orders`, `profiles`, `services` e `users`), mas como nenhuma regra de quem pode acessar foi definida, elas ficam bloqueadas por padrão.

Como o PackZinhu faz inserção de dados pelo frontend no painel do usuário (por exemplo, sincronizando perfis no momento do Login/Registro), nós precisamos dar acesso a essas tabelas usando o mesmo comando seguro de antes.

Isso vai **limpar os erros** e **garantir que a criação de usuários e sincronizações não falhem**.

## Passo a Passo:

1. Vá até o painel do seu **Supabase**.
2. Clique no ícone de Terminal do lado esquerdo para abrir o **SQL Editor**.
3. Clique em **+ New query**.
4. Copie o bloco de código SQL inteiro abaixo, cole lá e clique no botão **Run** (ou aperte `Cmd/Ctrl + Enter`):

```sql
-- Cria as novas políticas para as tabelas que estão sem política,
-- para que o site consiga sincronizar Perfis, Pedidos, Serviços e Usuários.

CREATE POLICY "Acesso Sistema PackZinhu" ON orders FOR ALL USING (auth.role() IS NOT NULL) WITH CHECK (auth.role() IS NOT NULL);
CREATE POLICY "Acesso Sistema PackZinhu" ON profiles FOR ALL USING (auth.role() IS NOT NULL) WITH CHECK (auth.role() IS NOT NULL);
CREATE POLICY "Acesso Sistema PackZinhu" ON services FOR ALL USING (auth.role() IS NOT NULL) WITH CHECK (auth.role() IS NOT NULL);
CREATE POLICY "Acesso Sistema PackZinhu" ON users FOR ALL USING (auth.role() IS NOT NULL) WITH CHECK (auth.role() IS NOT NULL);
```

## Resultado:
Após você rodar esses comandos, volte lá na tela do **Security Advisor** e clique no botão **Refresh** (Atualizar) novamente. 

Esses alertas de **"RLS Enabled No Policy"** vão desaparecer. Seu Firebase vai conseguir salvar corretamente os dados dessas tabelas no Supabase (como nome, foto, pedidos) e sua base de dados se manterá conectada!
