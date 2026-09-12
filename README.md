# NutriRank para Android e iPhone

Aplicativo Capacitor 8 com importação de anúncios do Mercado Livre, confirmação nutricional, ranking por custo de proteína, cupons separados, comparação, histórico local e exportação/backup. O visual e os cálculos vêm do NutriRank v5. A versão de computador original foi preservada separadamente.

## Estado real

- Projetos `android/` e `ios/` gerados e sincronizados.
- Cinco testes de armazenamento/validação passaram localmente. A interface passou em teste no Chrome com largura de celular, cadastro offline, persistência, comparação, cupons, histórico, exportação e exclusão.
- Compilação nativa e instalação em aparelho ainda não foram verificadas. Os workflows deste repositório farão a primeira compilação na nuvem.
- O importador consulta os endpoints públicos do Mercado Livre e sempre pede conferência do rótulo. Não há sincronização de dados entre aparelhos nem envio de alertas por push.
- O app móvel salva os produtos em um arquivo privado no aparelho. Não inclui o servidor Python nem o banco SQLite do computador. No navegador de desenvolvimento, usa armazenamento local. Exporte o backup antes de desinstalar.

## Android: obter um APK para testar

1. Abra **Actions → Gerar aplicativos de teste**.
2. Abra a execução mais recente ou use **Run workflow**.
3. Aguarde o trabalho **Android APK** terminar.
4. Baixe o artefato **NutriRank-Android-APK**, extraia o ZIP e instale `app-debug.apk` no Android.

O APK é de teste, assinado com chave temporária de desenvolvimento. Não é a versão para Google Play. A chave pode mudar entre execuções; isso pode exigir desinstalação antes de reinstalar. Faça backup dos cadastros antes. Uma chave permanente de distribuição deverá ser configurada para publicação e atualizações estáveis.

## iPhone: TestFlight

A compilação automática comum verifica o projeto para simulador e **não gera um aplicativo instalável no iPhone**. Para instalar sem Mac, configure a conta Apple e execute manualmente **Enviar iPhone ao TestFlight**.

Veja [APPLE.md](APPLE.md). A distribuição ao TestFlight é separada das compilações comuns e nunca dispara por push. A Apple ainda processa o envio e pode exigir informações de conformidade/revisão antes de liberar testes externos.

## Desenvolvimento

Node 24 e pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm exec cap sync
```

Android: abrir `android/` no Android Studio. iOS: abrir `ios/App/App.xcodeproj` no Xcode 26 ou posterior em macOS. O identificador inicial é `com.nutrirank.app`; sua disponibilidade na conta Apple deve ser confirmada antes de emitir o perfil.

Nunca coloque tokens do Mercado Livre ou chaves Apple no código, no ZIP do projeto ou em commits. O repositório informado é público.

Fontes: [ambiente Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup), [armazenamento nativo e privacidade](https://capacitorjs.com/docs/apis/filesystem), [runners macOS do GitHub](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md).
