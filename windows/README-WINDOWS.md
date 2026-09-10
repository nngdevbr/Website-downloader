# Website Downloader — Windows

## Se o instalador do Node falhar

Se aparecer:

> The Windows Installer Service could not be accessed

**não use o instalador `.msi`**. Este pacote baixa o **Node portátil (ZIP oficial do nodejs.org)** automaticamente.

## Passo a passo

1. Extraia o ZIP deste app
2. Duplo clique em `windows\setup.bat`
   - Se não houver Node, ele baixa sozinho o ZIP oficial
3. Duplo clique em `windows\start.bat`
4. Abra http://localhost:3000/

## Alternativa manual (se o download automático falhar)

1. Abra https://nodejs.org/en/download
2. Baixe **Windows Binary (.zip)** 64-bit (não o installer)
3. Extraia
4. Copie o conteúdo para: `runtime\node\`  
   (precisa existir `runtime\node\node.exe`)
5. Rode `windows\setup.bat` e depois `windows\start.bat`

## Observações

- Não precisa consertar o Windows Installer para usar este app
- O ZIP do Node vem do site oficial `nodejs.org` (não é um exe de terceiros)
- Para encerrar: na janela preta, `Ctrl+C`
