{
  description = "金融シミュレーションアプリ - TypeScript開発環境";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # --- Node.js Runtime ---
            nodejs_22  # Node.js v22 (最新LTS)

            # --- Alternative Runtimes ---
            deno       # Deno v1.x (TypeScriptネイティブ)
            bun        # Bun v1.x (超高速ランタイム)

            # --- Package Managers ---
            pnpm       # 高速パッケージマネージャー
            yarn       # Yarnパッケージマネージャー

            # --- Build Tools ---
            esbuild    # 超高速バンドラー
            # turbo は一時的に削除 (ビルドエラーのため)

            # --- TypeScript Tools ---
            typescript # TypeScriptコンパイラ (tsc)
            # ts-node は削除 (Node.js 22.6.0+ に組み込み: node --experimental-strip-types)

            # --- Linters & Formatters ---
            biome                  # 超高速リンター/フォーマッター (Rust製)
            # prettier, eslint は pnpm でプロジェクトごとにインストール

            # --- Testing ---
            # vitest, jest は pnpm でプロジェクトごとにインストール

            # --- Development Tools ---
            # nodemon, concurrently は pnpm でプロジェクトごとにインストール

            # --- Database (開発用) ---
            postgresql_16  # PostgreSQL 16
            sqlite         # SQLite

            # --- CLI Tools ---
            jq             # JSONパーサー
            gh             # GitHub CLI
            git            # Git
            # gitui は一時的に削除 (ビルドエラーのため)

            # --- Editor Support ---
            # Language Serversは各エディタで自動インストールされる
            # または pnpm でプロジェクトごとにインストール
          ];

          shellHook = ''
            echo "🚀 金融シミュレーションアプリ - TypeScript開発環境"
            echo ""
            echo "📦 利用可能なランタイム:"
            echo "  - Node.js:    $(node --version)"
            echo "  - Deno:       $(deno --version | head -1)"
            echo "  - Bun:        $(bun --version)"
            echo ""
            echo "🛠️  利用可能なツール:"
            echo "  - TypeScript: $(tsc --version)"
            echo "  - pnpm:       $(pnpm --version)"
            echo "  - Biome:      $(biome --version)"
            echo "  - PostgreSQL: $(postgres --version)"
            echo ""
            echo "💡 クイックスタート:"
            echo "  - Deno プロジェクト初期化:  deno init"
            echo "  - Bun プロジェクト初期化:   bun init"
            echo "  - Node プロジェクト初期化:  pnpm init"
            echo "  - TypeScript直接実行 (Node): node --experimental-strip-types file.ts"
            echo "  - テスト実行:               bun test or deno test"
            echo ""
            echo "📚 ドキュメント:"
            echo "  - docs/architecture_philosophy.md"
            echo ""

            # 環境変数設定
            export NODE_ENV=development
            export DATABASE_URL="postgresql://localhost/financial_app_dev"

            # pnpmのストアディレクトリ設定
            export PNPM_HOME="$PWD/.pnpm"
            export PATH="$PNPM_HOME:$PATH"

            # Denoのキャッシュディレクトリ
            export DENO_DIR="$PWD/.deno"

            # Bunのインストールディレクトリ
            export BUN_INSTALL="$PWD/.bun"
            export PATH="$BUN_INSTALL/bin:$PATH"

            # PostgreSQLデータディレクトリ（ローカル開発用）
            export PGDATA="$PWD/.postgres"

            # PostgreSQL初期化（初回のみ）
            if [ ! -d "$PGDATA" ]; then
              echo "📦 PostgreSQL データディレクトリを初期化中..."
              initdb -D "$PGDATA" --no-locale --encoding=UTF8
              echo "✅ 初期化完了"
              echo ""
              echo "💡 PostgreSQL起動: pg_ctl -D .postgres start"
              echo "💡 PostgreSQL停止: pg_ctl -D .postgres stop"
            fi
          '';

          # Node.js環境変数
          NODE_OPTIONS = "--max-old-space-size=4096";
        };

        # --- アプリケーションパッケージ（将来の本番ビルド用） ---
        # pnpmを使用する場合は mkPnpmPackage を検討
        # または stdenv.mkDerivation でカスタムビルドプロセスを定義
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "financial-simulation-app";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.pnpm pkgs.nodejs_22 ];

          # package.jsonが作成されたら以下を実装:
          # buildPhase = ''
          #   pnpm install --frozen-lockfile
          #   pnpm build
          # '';
          # installPhase = ''
          #   mkdir -p $out
          #   cp -r dist/* $out/
          # '';

          meta = with pkgs.lib; {
            description = "金融ライフプラン・投資シミュレーションアプリ";
            license = licenses.mit;
          };
        };
      }
    );
}
