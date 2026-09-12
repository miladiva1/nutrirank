# Ativar TestFlight sem Mac

O workflow está preparado para assinatura manual com certificado de distribuição e perfil App Store Connect. Ter uma conta Apple Developer é necessário, mas não cria esses arquivos automaticamente.

## Na Apple

1. Confirme que a inscrição Apple Developer está ativa.
2. Em Certificates, Identifiers & Profiles, registre o Bundle ID `com.nutrirank.app` se estiver disponível na sua conta. Se indisponível, escolha outro identificador e atualize também o projeto antes de emitir o perfil.
3. No App Store Connect, crie o registro do NutriRank com o mesmo Bundle ID.
4. Gere/obtenha um certificado **Apple Distribution** com sua chave privada, exportado como `.p12`, protegido por senha.
5. Gere um perfil de distribuição **App Store Connect** para esse certificado e Bundle ID (`.mobileprovision`). Não use perfil Development ou Ad Hoc.
6. Crie uma chave de API do App Store Connect com permissão para enviar builds. Guarde o `.p8`, o Key ID e o Issuer ID.

Os itens 4–6 dependem da sua conta. Não foram criados nem enviados por este projeto. A conta pode ter restrições de função ou exigir habilitação de acesso à API.

## No GitHub

No repositório, abra **Settings → Environments**, crie `apple-testflight` e cadastre:

| Tipo | Nome | Conteúdo |
|---|---|---|
| Variable | `APPLE_TEAM_ID` | Team ID da sua conta Apple |
| Secret | `APPLE_API_KEY_ID` | Key ID da API App Store Connect |
| Secret | `APPLE_API_ISSUER_ID` | Issuer ID da API |
| Secret | `APPLE_API_PRIVATE_KEY` | Conteúdo integral do arquivo `.p8` |
| Secret | `APPLE_CERTIFICATE_BASE64` | Arquivo `.p12` codificado em base64, numa linha |
| Secret | `APPLE_CERTIFICATE_PASSWORD` | Senha do `.p12` |
| Secret | `APPLE_PROFILE_BASE64` | Arquivo `.mobileprovision` codificado em base64, numa linha |

Não cole nenhum desses valores no chat, em issues ou em arquivos do repositório. Cadastre diretamente nos campos de Secrets do GitHub. Base64 é apenas codificação, não criptografia. Configure os valores quando os arquivos Apple reais estiverem disponíveis; não use exemplos inventados.

O workflow valida o Team ID, o Bundle ID e a validade do perfil. Certificado e chave são usados apenas no runner macOS temporário e removidos ao final. O upload ocorre somente ao executar manualmente **Actions → Enviar iPhone ao TestFlight → Run workflow**. Ele não publica na App Store nem convida testadores automaticamente.

Depois do processamento da Apple, abra **App Store Connect → NutriRank → TestFlight** para concluir eventuais perguntas e autorizar os testadores.

Se a sua conta tiver um build com número maior que o contador atual do workflow, ajuste a numeração antes de enviar novamente.
