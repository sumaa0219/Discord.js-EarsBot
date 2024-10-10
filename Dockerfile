FROM ubuntu:latest

# 作業ディレクトリの作成
RUN mkdir -p /usr/app
WORKDIR /usr/app

# 必要なパッケージのインストール
RUN apt-get update && \
    apt-get install -y curl ffmpeg python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Node.js 18のインストール
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# ローカルの作業ディレクトリの内容をコピー
COPY ./ ./

# 依存関係のインストール
RUN npm install && npm update

# deploy-command.jsを実行
RUN node deploy-command.js

# コンテナ起動時に実行するコマンド
CMD ["node", "index.js"]