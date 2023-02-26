FROM node:18-alpine AS api-build

WORKDIR /srv/app
COPY ./build ./

RUN chown -R node /srv/app

#EXPOSE 3000

CMD ["node", "./server.js"]