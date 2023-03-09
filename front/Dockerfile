FROM node:18.13.0-bullseye-slim
RUN apt update && apt install -y --no-install-recommends dumb-init
WORKDIR /usr/app
COPY --chown=node:node package.json package.json
RUN npm install --omit=dev
COPY --chown=node:node . .
USER node
ENV NODE_ENV production
CMD [ "dumb-init", "node", "." ]
