FROM node:20-alpine
WORKDIR /app
# sharp ships prebuilt linux-musl binaries; no build toolchain needed here.
RUN npm i sharp@0.35.3 --silent --no-audit --no-fund
COPY gen.js /app/gen.js
CMD ["node", "/app/gen.js"]
