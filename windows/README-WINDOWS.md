# Website Downloader — pacote Windows

Este pacote deixa o app pronto para rodar no Windows sem depender de shell Linux.

## Requisitos

- Windows 10/11
- [Node.js 16+](https://nodejs.org/) (marque a opção de adicionar ao PATH)

## Instalação rápida

1. Extraia este ZIP
2. Dê dois cliques em `windows\setup.bat`
3. Dê dois cliques em `windows\start.bat`
4. Abra no navegador: http://localhost:3000/

O `setup.bat` instala as dependências npm e garante um `wget`:

1. usa `wget` se já estiver no PATH  
2. tenta instalar com `winget install JernejSimoncic.Wget`  
3. se necessário, baixa um `wget.exe` portable em `vendor\wget\`

## Uso

1. Cole a URL do site (ex.: `https://example.com`)
2. Clique no botão de download
3. Quando terminar, clique em **Download website assets** para baixar o ZIP

## Variáveis opcionais

| Variável | Padrão | Função |
| --- | --- | --- |
| `PORT` | `3000` | Porta do servidor |
| `DOWNLOAD_QUOTA` | `100m` | Limite de tamanho do wget |
| `DOWNLOAD_TIMEOUT_MS` | `300000` | Tempo máximo por download |
| `WGET_PATH` | (auto) | Caminho absoluto do `wget.exe` |

No PowerShell, antes de `start.bat`:

```powershell
$env:PORT = "3000"
$env:WGET_PATH = "C:\caminho\para\wget.exe"
```

## Solução de problemas

- **"wget is not installed"** → rode `windows\setup.bat` de novo, ou copie um `wget.exe` para `vendor\wget\wget.exe`
- **"Node.js nao encontrado"** → reinstale o Node e reabra o terminal
- **Porta em uso** → `$env:PORT = "3001"` e rode `windows\start.bat`
- **Antivírus bloqueou wget.exe** → permita o arquivo em `vendor\wget\` ou instale via winget

## Estrutura

```
windows\setup.bat        instalação
windows\start.bat        inicia o servidor
windows\ensure-wget.ps1  encontra/baixa wget
vendor\wget\             wget portable (após setup)
```
