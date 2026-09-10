# Website Downloader — pacote Windows (sem vírus / sem .exe externo)

Este pacote **não baixa nem inclui** `wget.exe`. O alerta de “vírus” do
navegador costuma ser falso positivo causado exatamente por scripts que
baixam executáveis de terceiros — isso foi removido.

## Requisitos

- Windows 10/11
- [Node.js LTS](https://nodejs.org/) (marque “Add to PATH”)

## Instalação

1. Extraia o ZIP
2. Duplo clique em `windows\setup.bat` (só roda `npm install`)
3. Duplo clique em `windows\start.bat`
4. Abra http://localhost:3000/

## Como funciona no Windows

- Se existir `wget` no sistema, ele é usado
- Se não existir, o app usa um **downloader embutido em Node.js** (só JavaScript)
- Nada de `Invoke-WebRequest` baixando `.exe`

## Se o navegador ainda avisar

Arquivos `.zip` novos no GitHub às vezes caem no Safe Browsing / SmartScreen
por serem “pouco comuns”, não por malware.

1. Prefira baixar pela página do GitHub (botão Download do arquivo), não de links estranhos
2. Em “Mais informações” → “Baixar mesmo assim” / “Executar mesmo assim”
3. Confira o checksum em `dist/SHA256SUMS.txt` se quiser validar o arquivo

## Uso

1. Cole a URL (ex.: `https://example.com`)
2. Clique no botão de download
3. Ao terminar, clique em **Download website assets**

## Variáveis opcionais

| Variável | Padrão | Função |
| --- | --- | --- |
| `PORT` | `3000` | Porta do servidor |
| `DOWNLOAD_QUOTA` | `100m` | Limite de tamanho |
| `DOWNLOAD_TIMEOUT_MS` | `300000` | Tempo máximo por download |
| `WGET_PATH` | (auto) | Só se você já tiver um wget instalado |

## Solução de problemas

- **"Node.js nao encontrado"** → instale o Node LTS e reabra o Explorer/terminal
- **Porta em uso** → no PowerShell: `$env:PORT="3001"; windows\start.bat`
- **Antivírus bloqueou o ZIP** → é falso positivo comum; o pacote só tem JS + `.bat` que chamam `npm`
