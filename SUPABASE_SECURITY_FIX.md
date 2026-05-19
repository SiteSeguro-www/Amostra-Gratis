# Como corrigir a Falha de Segurança no Supabase (Bucket "mídia" / "media")

O alerta que você viu no Supabase (Permissão LIST) significa que a sua política de segurança atual permite que qualquer pessoa com conhecimento técnico liste ("veja o nome de") todos os arquivos salvos lá. Como os conteúdos secretos usam URLs difíceis de adivinhar, a única forma de alguém "vazar tudo" é conseguindo a lista de arquivos.

Para deixar o sistema 100% Funcional e Seguro, onde o usuário só acessa aquilo que ele comprou (e cujo link o sistema entregou para ele), você deve ajustar as políticas (`RLS - Row Level Security`) no seu Supabase.

## Passo a Passo para Corrigir

1. Acesse o **Dashboard do Supabase**.
2. Vá no painel lateral esquerdo e clique em **SQL Editor** (um ícone de terminal / código `>_`).
3. Clique em **+ New query** (Nova consulta).
4. Copie o script SQL abaixo e cole no espaço de texto:

```sql
-- 1. APAGUE AS POLÍTICAS PERIGOSAS ANTIGAS PARA O BUCKET 'media' ou 'mídia'
-- Substitua 'media' pelo nome real do seu bucket se não for esse.
-- (Esse comando limpa eventuais políticas muito abertas)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to all" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um pode ler" ON storage.objects;

-- 2. BLOQUEAR O LIST (SELECT) DE FORMA GERAL e REFAZER COM SEGURANÇA
-- A política de SELECT agora SÓ VAI PERMITIR listar se a pessoa estiver logada (como admin, opcional)
-- OU não permitir listar nada (o sistema não usa o método .list(), apenas getPublicUrl que já funciona para buckets públicos)

-- Permite ao usuário (autenticado ou anonimo) Fazer UPLOAD de mídia
-- Isso é necessário para o Packzinhu funcionar na hora dos criadores subirem conteúdo.
CREATE POLICY "Permitir Upload para Todos" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK ( bucket_id = 'media' );

-- Permite UPDATE ou DELETE apenas a quem enviou (opcional, mas recomendado)
-- O PackZinhu deleta pelo Firebase, mas enviar arquivos precisa disso.

-- Nota Importante: Como seu bucket foi criado como PÚBLICO para entregar imagens 
-- rapidamente nos Feeds e Perfis, o simples fato dele ser "Public Bucket" já libera a URL direta.
-- Você NÃO PRECISA de uma política SELECT permissiva na tabela storage.objects. 
-- Remover as políticas de SELECT é a forma de corrigir o "Aviso de Listagem" (List Permission Warning).
```

5. Clique no botão **Run** (ou `Cmd+Enter` / `Ctrl+Enter`) no canto inferior direito para rodar o comando.

### E se não quiser usar o SQL Editor?

Você também pode fazer isso clicando pelo mouse:
1. Vá no menu **Storage** -> **Policies**.
2. Na tabela `storage.objects`, procure uma política de grupo que tenha **SELECT**.
3. Se estiver liberada para "Public" / sem restrições, clique nos três pontinhos e clique em **Delete** (Remover política).
   - O próprio aviso laranja que você nos mandou tem um botão **"Remover política"**. Pode clicar nele sem medo!
4. Certifique-se de manter apenas as permissões de **INSERT** ativas, pois o site precisa permitir fazer envios de arquivos.

## Pronto!
A partir do momento que você remove essa política "SELECT", os hackers perdem o acesso a listar o conteúdo. A plataforma continuará funcionando (carregando imagens no Feed), pois buckets Públicos disponibilizam a URL de forma nativa pela chave individual da imagem, sem expor o diretório inteiro.
